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
   * The entity map to store entities in.
   */
  private entities: EntityMap;

  /**
   * The map of queries to the entities that match that query.
   */
  private cachedQueries: Map<string, Set<string>> = new Map();

  /**
   * All the query keys in the `cachedQueries` map.
   */
  private cachedEntityQueries: EntityQuery[] = [];

  private onEntityCreated = (entity: Entity) => {
    this.updateCachedQueriesForEntity(entity);
  };

  private onEntityDestroyed = (entity: Entity) => {
    this.deleteEntityFromCachedQueries(entity);
  };

  private onEntityModified = (entity: Entity) => {
    this.updateCachedQueriesForEntity(entity);
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
    for (const system of [...this.systems]) {
      if (!this.hasSystem(system)) {
        continue;
      }

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
    for (const system of [...this.systems]) {
      if (!this.hasSystem(system)) {
        continue;
      }

      system.fixedUpdate?.(this.createSystemUpdateData(engine, system, dt));
    }
  }

  /**
   * Runs a state update for the systems in the registry.
   *
   * @param engine The engine owning the registry.
   */
  public stateUpdate(engine: Engine) {
    for (const system of [...this.systems]) {
      if (!this.hasSystem(system)) {
        continue;
      }

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

    if (this.type === RegistryType.SERVER) {
      this.onEntityDestroyed(this.entities.get(id)!);
    }

    this.entities.delete(id);
  }

  /**
   * Removes an entity from the registry and doesn't throw an error if it doesn't exist.
   *
   * @note This is useful for when you want to remove an entity but don't know if it exists.
   *
   * @param id The id of the entity to destroy.
   */
  public safeDestroy(id: string) {
    if (!this.entities.has(id)) {
      return;
    }

    this.destroy(id);
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
   * Performs an inline query on the registry.
   *
   * @note DO NOT MODIFY THE SET RETURNED BY THIS FUNCTION.
   *
   * @warning If you fill the cache with lots of queries that are rarely used, it could decrease performance. Remember: all cached queries must be checked and potentially updated with every entity modification (component add/remove, entity deletion).
   *
   * @param query The query to use to get the entities.
   * @param addQueryToCache Wether to add the query to the cache or not. This is used for performance reasons. Set this to false if you are going to use the query only once.
   *
   * @returns The entities that match the query.
   */
  public query(query: EntityQuery, addQueryToCache = true): Set<string> {
    const entities = this.cachedQueries.get(Registry.getEntityQueryKey(query));
    if (entities) {
      return entities;
    }

    const set = new Set<string>();
    for (const entity of this.entities.values()) {
      if (Entity.matchesQuery(entity, query)) {
        set.add(entity.id);
      }
    }

    if (addQueryToCache) {
      this.cachedQueries.set(Registry.getEntityQueryKey(query), set);
      this.cachedEntityQueries.push(query);
    }

    return set;
  }

  /**
   * Removes a query from the cache.
   *
   * If the query is not in the cache, this function does nothing. Next time the query is used (and `addQueryToCache` is true), it will be added to the cache again.
   *
   * @param query The query to remove from the cache.
   */
  public removeQueryFromCache(query: EntityQuery) {
    const key = Registry.getEntityQueryKey(query);
    this.cachedQueries.delete(key);
    this.cachedEntityQueries = this.cachedEntityQueries.filter((q) => Registry.getEntityQueryKey(q) !== key);
  }

  /**
   * Clears the query cache.
   *
   * This is useful if you are completely changing scenes or systems and want to clear all the cached queries to free up memory and improve performance.
   *
   * @warning Use this carefully as it could cause drastic performance degradation if you are not careful.
   */
  public clearQueryCache() {
    this.cachedQueries.clear();
    this.cachedEntityQueries = [];
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
      // Logger.warn(
      //   "REGISTRY",
      //   `You are trying to add a system to the registry that does not match the registry type. System ${system.constructor.name} is of type ${system.type}, but the registry is of type ${this.type}.`
      // );
      return;
    }

    if (this.systems.includes(system)) {
      Logger.errorAndThrow("Registry", "System already in registry.");
    }

    this.systems.push(system);
    this.systems.sort((a, b) => b.priority - a.priority);

    this.updateCachedQueriesForSystems();
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

    this.updateCachedQueriesForSystems();
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
   * Gets the systems in the registry.
   *
   * This returns a copy of the systems array, but the systems themselves are not copied.
   *
   * @returns The systems in the registry.
   */
  public getSystems() {
    return [...this.systems];
  }

  /**
   * Clears all the systems from the registry.
   */
  public clearSystems() {
    this.systems = [];
    this.updateCachedQueriesForSystems();
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
    cb: (entity: Entity, component: Component, componentName: string) => void,
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
    cb: (entity: Entity, component: Component, componentName: string) => void,
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

  private getAllSystemEntityQueries() {
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

  private updateCachedQueriesForSystems() {
    const systemEntityQueries = this.getAllSystemEntityQueries();

    // reset the query entities
    const newQueries: Set<EntityQuery> = new Set();

    for (const query of systemEntityQueries) {
      const key = Registry.getEntityQueryKey(query);

      if (!this.cachedQueries.has(key)) {
        this.cachedQueries.set(key, new Set());
        this.cachedEntityQueries.push(query);

        newQueries.add(query);
      }
    }

    // add entities to the new queries
    for (const entity of this.entities.values()) {
      for (const query of newQueries) {
        if (Entity.matchesQuery(entity, query)) {
          this.cachedQueries.get(Registry.getEntityQueryKey(query))!.add(entity.id);
        }
      }
    }
  }

  private updateCachedQueriesForEntity(entity: Entity) {
    for (const query of this.cachedEntityQueries) {
      if (Entity.matchesQuery(entity, query)) {
        this.cachedQueries.get(Registry.getEntityQueryKey(query))!.add(entity.id);
      } else {
        this.cachedQueries.get(Registry.getEntityQueryKey(query))!.delete(entity.id);
      }
    }
  }

  private deleteEntityFromCachedQueries(entity: Entity) {
    for (const query of this.cachedEntityQueries) {
      this.cachedQueries.get(Registry.getEntityQueryKey(query))?.delete(entity.id);
    }
  }

  public createSystemUpdateData(engine: Engine, system: System, dt: number = -1): SystemUpdateData {
    return {
      engine: engine,
      registry: this,
      sceneGraph: engine.sceneGraph,
      entities: this.cachedQueries.get(system.queryKey)!,
      dt,
    };
  }
}
