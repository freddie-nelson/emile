import { Logger } from "@shared/src/Logger";
import { Component, ComponentConstructor } from "./component";
import { System, SystemType } from "./system";
import { MapSchema, Schema } from "@colyseus/schema";
import { Entity, EntityQuery } from "./entity";

export type EntityMap = MapSchema<Entity>;

export enum RegistryType {
  SERVER,
  CLIENT,
}

export class Registry {
  /**
   * The systems in the registry.
   *
   * @note Only use the addSystem and removeSystem methods to modify this array.
   */
  private systems: System[] = [];

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
  private queryEntities: Map<string, Set<Entity>> = new Map();

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
      });

      this.entities.onRemove((entity, key) => {
        this.onEntityDestroyed(entity);
      });
    }
  }

  /**
   * Creates a new entity.
   *
   * @returns The new entity's id.
   */
  public create(components: MapSchema<Component>): string {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    // @ts-ignore
    entity.components = components;

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

      return this.entities.get(id)!.hasComponent(component);
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

    this.entities.get(id)!.addComponent(component);

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

    this.entities.get(id)!.removeComponent(component);

    if (this.type === RegistryType.SERVER) {
      this.onEntityModified(this.entities.get(id)!);
    }
  }

  /**
   * Checks if an entity has a component.
   *
   * @param id The id of the entity to get the component from.
   * @param component The component to get from the entity.
   *
   * @returns The component instance.
   */
  public get<T extends Component>(id: string, component: new () => T): T {
    if (!this.entities.has(id)) {
      Logger.errorAndThrow("Registry", `Entity with id '${id}' not found in registry.`);
    }

    return this.entities.get(id)!.getComponent(component);
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

  private entityQueryKeyCache: Map<EntityQuery, string> = new Map();
  private getEntityQueryKey(query: EntityQuery) {
    if (this.entityQueryKeyCache.has(query)) {
      return this.entityQueryKeyCache.get(query)!;
    }

    const key = Array.from(query.values())
      .map((component) => component.name)
      .sort()
      .join(",");

    this.entityQueryKeyCache.set(query, key);

    return key;
  }

  private getAllEntityQueries() {
    const queries: EntityQuery[] = [];
    const keys = new Set<string>();

    for (const system of this.systems) {
      const k = this.getEntityQueryKey(system.query);
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
      this.queryEntities.set(this.getEntityQueryKey(query), new Set());
    }

    // add entities to the query entities
    for (const entity of this.entities.values()) {
      for (const query of this.entityQueries) {
        if (entity.matchesQuery(query)) {
          this.queryEntities.get(this.getEntityQueryKey(query))!.add(entity);
        }
      }
    }
  }

  private updateEntityMapsForEntity(entity: Entity) {
    for (const query of this.entityQueries) {
      if (entity.matchesQuery(query)) {
        this.queryEntities.get(this.getEntityQueryKey(query))!.add(entity);
      } else {
        this.queryEntities.get(this.getEntityQueryKey(query))!.delete(entity);
      }
    }
  }

  private deleteEntityFromEntityMaps(entity: Entity) {
    for (const query of this.entityQueries) {
      this.queryEntities.get(this.getEntityQueryKey(query))!.delete(entity);
    }
  }
}
