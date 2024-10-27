import { Logger } from "@shared/src/Logger";
import {
  Component,
  ComponentConstructor,
  GenericComponentConstructor,
  getComponentIdFromConstructor,
} from "./component";
import { System, SystemType, SystemUpdateData } from "./system";
import { MapSchema } from "@colyseus/schema";
import { Entity, EntityQuery } from "./entity";
import Engine from "../engine";
import { CircleCollider, PolygonCollider, RectangleCollider } from "../physics/collider";
import { Rigidbody } from "../physics/rigidbody";
import { Constraint } from "../physics/constraint";

export type EntityMap = MapSchema<Entity>;

export enum RegistryType {
  SERVER,
  CLIENT,
}

export class Registry {
  private static entityQueryKeyCache: Map<EntityQuery, string> = new Map();

  /**
   * Gets the key for an entity query.
   *
   * This is used internally by the registry for caching.
   *
   * @param query The query to get the key for.
   *
   * @returns The key for the query.
   */
  static getEntityQueryKey(query: EntityQuery) {
    if (this.entityQueryKeyCache.has(query)) {
      return this.entityQueryKeyCache.get(query)!;
    }

    const key = Array.from(query.values())
      .map((component) => getComponentIdFromConstructor(component))
      .sort()
      .join(",");

    this.entityQueryKeyCache.set(query, key);

    return key;
  }

  /**
   * The systems in the registry.
   *
   * @note Only use the addSystem and removeSystem methods to modify this array.
   */
  private systems: System[] = [];

  /**
   * The component add listeners.
   *
   * These are callbacks that are called when a component is added to an entity.
   *
   * The key is the component's constructor name.
   */
  private componentAddListeners: Map<
    string,
    Set<(entity: Entity, component: Component, componentName: string) => void>
  > = new Map();

  /**
   * All the distinct entity queries for the systems in the registry.
   */
  private entityQueries: EntityQuery[] = [];

  /**
   * The entity map to store entities in.
   */
  private entities: EntityMap;

  /**
   * The map of queries to the entities that match that query.
   */
  private queryEntities: Map<string, Set<string>> = new Map();

  private onEntityCreated = (entity: Entity) => {
    this.updateEntityMapsForEntity(entity);
  };

  private onEntityDestroyed = (entity: Entity) => {
    this.deleteEntityFromEntityMaps(entity);
  };

  private onEntityModified = (entity: Entity) => {
    this.updateEntityMapsForEntity(entity);
  };

  /**
   * The type of the registry.
   *
   * This is used to dertmine what systems can be added to the registry, among other things.
   */
  public readonly type: RegistryType;

  /**
   * Creates a new registry.
   *
   * @param type The type of the registry.
   * @param entities The entity map to store entities in.
   */
  constructor(type: RegistryType, entities: EntityMap) {
    this.type = type;
    this.entities = entities;

    if (this.type === RegistryType.SERVER) {
      for (const entity of this.entities.values()) {
        this.onEntityCreated(entity);
      }
    } else {
      this.entities.onAdd((entity, key) => {
        this.onEntityCreated(entity);
        entity.listen("components", () => this.onEntityModified(entity));
        entity.components.onAdd((component, key) => this.fireComponentAddListeners(entity, component, key));
      });

      this.entities.onRemove((entity, key) => {
        this.onEntityDestroyed(entity);
      });

      this.addComponentListener(CircleCollider, CircleCollider.onComponentAdded);
      this.addComponentListener(RectangleCollider, RectangleCollider.onComponentAdded);
      this.addComponentListener(PolygonCollider, PolygonCollider.onComponentAdded);
      this.addComponentListener(Rigidbody, Rigidbody.onComponentAdded);
      this.addComponentListener(Constraint, Constraint.onComponentAdded);
    }
  }

  /**
   * Disposes of the registry.
   *
   * @param engine The engine owning the registry.
   */
  public dispose(engine: Engine) {
    for (const system of this.systems) {
      system.dispose?.(this.createSystemUpdateData(engine, system));
    }
  }

  /**
   * Runs an update for the systems in the registry.
   *
   * @param engine The engine owning the registry.
   * @param dt The delta time since the last update.
   */
  public update(engine: Engine, dt: number) {
    for (const system of this.systems) {
      system.update?.(this.createSystemUpdateData(engine, system, dt));
    }
  }

  /**
   * Runs a fixed update for the systems in the registry.
   *
   * @param engine The engine owning the registry.
   * @param dt The delta time since the last fixed update. (this should be constant)
   */
  public fixedUpdate(engine: Engine, dt: number) {
    for (const system of this.systems) {
      system.fixedUpdate?.(this.createSystemUpdateData(engine, system, dt));
    }
  }

  /**
   * Runs a state update for the systems in the registry.
   *
   * @param engine The engine owning the registry.
   */
  public stateUpdate(engine: Engine) {
    for (const system of this.systems) {
      system.stateUpdate?.(this.createSystemUpdateData(engine, system));
    }
  }

  /**
   * Creates a new entity.
   *
   * @returns The new entity's id.
   */
  public create(): string {
    const entity = new Entity();
    this.entities.set(entity.id, entity);

    if (this.type === RegistryType.SERVER) {
      this.onEntityCreated(entity);
    }

    return entity.id;
  }

  /**
   * Removes an entity from the registry.
   *
   * @param id The id of the entity to destroy.
   */
  public destroy(id: string) {
    if (!this.entities.has(id)) {
      Logger.errorAndThrow("Registry", `Entity with id '${id}' not found in registry.`);
    }

    this.entities.delete(id);

    if (this.type === RegistryType.SERVER) {
      this.onEntityDestroyed(this.entities.get(id)!);
    }
  }

  /**
   * Checks if an entity is in the registry.
   *
   * @param id The id of the entity to check for.
   *
   * @returns True if the entity is in the registry, false otherwise.
   */
  public has(id: string): boolean;

  /**
   * Checks if an entity has a component in the registry.
   *
   * @param id The id of the entity to check.
   * @param component The component to check for.
   *
   * @returns True if the entity has the component, false otherwise.
   */
  public has(id: string, component: ComponentConstructor): boolean;

  public has(id: string, component?: ComponentConstructor) {
    if (component) {
      if (!this.entities.has(id)) {
        Logger.errorAndThrow("Registry", `Entity with id '${id}' not found in registry.`);
      }

      return Entity.hasComponent(this.entities.get(id)!, component);
    }

    return this.entities.has(id);
  }

  /**
   * Adds a component to an entity.
   *
   * @param id The id of the entity to add the component to.
   * @param component The component to add to the entity.
   *
   * @returns The component instance.
   */
  public add<T extends Component>(id: string, component: T): T {
    if (!this.entities.has(id)) {
      Logger.errorAndThrow("Registry", `Entity with id '${id}' not found in registry.`);
    }

    Entity.addComponent(this.entities.get(id)!, component);

    if (this.type === RegistryType.SERVER) {
      this.onEntityModified(this.entities.get(id)!);
    }

    return component;
  }

  /**
   * Removes a component from an entity.
   *
   * @param id The id of the entity to remove the component from.
   * @param component The component to remove from the entity.
   */
  public remove(id: string, component: ComponentConstructor) {
    if (!this.entities.has(id)) {
      Logger.errorAndThrow("Registry", `Entity with id '${id}' not found in registry.`);
    }

    Entity.removeComponent(this.entities.get(id)!, component);

    if (this.type === RegistryType.SERVER) {
      this.onEntityModified(this.entities.get(id)!);
    }
  }

  /**
   * Checks if an entity has a component.
   *
   * If the entity or component is not found, an error will be thrown.
   *
   * @param id The id of the entity to get the component from.
   * @param component The component to get from the entity.
   *
   * @returns The component instance.
   */
  public get<T extends Component>(id: string, component: GenericComponentConstructor<T>): T;

  /**
   * Gets an entity from the registry.
   *
   * If the entity is not found, an error will be thrown.
   *
   * @param id The id of the entity to get.
   *
   * @returns The entity.
   */
  public get(id: string): Entity;

  public get(id: string, component?: ComponentConstructor) {
    if (!this.entities.has(id)) {
      Logger.errorAndThrow("Registry", `Entity with id '${id}' not found in registry.`);
    }

    if (!component) {
      return this.entities.get(id)!;
    }

    return Entity.getComponent(this.entities.get(id)!, component);
  }

  /**
   * Gets the entities in the registry.
   *
   * @returns The entities in the registry.
   */
  public getEntities() {
    return this.entities;
  }

  /**
   * Adds a system to the registry.
   *
   * If the system type does not match the registry type, it will not be added, no error will be thrown.
   *
   * If the system is already in the registry, an error will be thrown.
   *
   * @param system The system to add to the registry.
   */
  public addSystem(system: System) {
    if (!this.doesSystemTypeMatch(system)) {
      return;
    }

    if (this.systems.includes(system)) {
      Logger.errorAndThrow("Registry", "System already in registry.");
    }

    this.systems.push(system);
    this.systems.sort((a, b) => b.priority - a.priority);

    this.updateEntityMaps();
  }

  /**
   * Removes a system from the registry.
   *
   * If the system is not in the registry, an error will be thrown.
   *
   * @param system The system to remove from the registry.
   */
  public removeSystem(system: System) {
    const index = this.systems.indexOf(system);
    if (index === -1) {
      Logger.errorAndThrow("Registry", "System not found in registry.");
    }

    this.systems.splice(index, 1);
    this.systems.sort((a, b) => b.priority - a.priority);

    this.updateEntityMaps();
  }

  /**
   * Checks if a system is in the registry.
   *
   * @param system The system to check for.
   *
   * @returns True if the system is in the registry, false otherwise.
   */
  public hasSystem(system: System) {
    return this.systems.includes(system);
  }

  /**
   * Checks if the system type matches the registry type.
   *
   * @param system The system to check if the type matches the registry type.
   *
   * @returns Whether the system type matches the registry type.
   */
  public doesSystemTypeMatch(system: System) {
    return (
      system.type === SystemType.SERVER_AND_CLIENT ||
      (system.type === SystemType.SERVER && this.type === RegistryType.SERVER) ||
      (system.type === SystemType.CLIENT && this.type === RegistryType.CLIENT)
    );
  }

  /**
   * Adds a component add listener.
   *
   * @param component The component to listen for.
   * @param cb The callback to call when the component is added to an entity.
   */
  public addComponentListener(
    component: ComponentConstructor,
    cb: (entity: Entity, component: Component, componentName: string) => void
  ) {
    const key = getComponentIdFromConstructor(component);
    if (!this.componentAddListeners.has(key)) {
      this.componentAddListeners.set(key, new Set());
    }

    this.componentAddListeners.get(key)!.add(cb);
  }

  /**
   * Removes a component add listener.
   *
   * @param component The component the callback is listening for.
   * @param cb The callback to remove.
   */
  public removeComponentListener(
    component: ComponentConstructor,
    cb: (entity: Entity, component: Component, componentName: string) => void
  ) {
    const key = getComponentIdFromConstructor(component);
    if (!this.componentAddListeners.has(key)) {
      return;
    }

    this.componentAddListeners.get(key)!.delete(cb);
  }

  private fireComponentAddListeners(entity: Entity, component: Component, componentName: string) {
    if (!this.componentAddListeners.has(componentName)) {
      return;
    }

    for (const cb of this.componentAddListeners.get(componentName)!) {
      cb(entity, component, componentName);
    }
  }

  private getAllEntityQueries() {
    const queries: EntityQuery[] = [];
    const keys = new Set<string>();

    for (const system of this.systems) {
      const k = Registry.getEntityQueryKey(system.query);
      if (!keys.has(k)) {
        queries.push(system.query);
        keys.add(k);
      }
    }

    return queries;
  }

  private updateEntityMaps() {
    // update the entity queries
    this.entityQueries = this.getAllEntityQueries();

    // reset the query entities
    this.queryEntities.clear();
    for (const query of this.entityQueries) {
      this.queryEntities.set(Registry.getEntityQueryKey(query), new Set());
    }

    // add entities to the query entities
    for (const entity of this.entities.values()) {
      for (const query of this.entityQueries) {
        if (Entity.matchesQuery(entity, query)) {
          this.queryEntities.get(Registry.getEntityQueryKey(query))!.add(entity.id);
        }
      }
    }
  }

  private updateEntityMapsForEntity(entity: Entity) {
    for (const query of this.entityQueries) {
      if (Entity.matchesQuery(entity, query)) {
        this.queryEntities.get(Registry.getEntityQueryKey(query))!.add(entity.id);
      } else {
        this.queryEntities.get(Registry.getEntityQueryKey(query))!.delete(entity.id);
      }
    }
  }

  private deleteEntityFromEntityMaps(entity: Entity) {
    for (const query of this.entityQueries) {
      this.queryEntities.get(Registry.getEntityQueryKey(query))!.delete(entity.id);
    }
  }

  private createSystemUpdateData(engine: Engine, system: System, dt: number = -1): SystemUpdateData {
    return {
      engine: engine,
      registry: this,
      entities: this.queryEntities.get(system.queryKey)!,
      dt,
    };
  }
}
