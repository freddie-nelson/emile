import { MapSchema, Schema, type } from "@colyseus/schema";
import { Component, ComponentConstructor } from "./component";
import { Logger } from "@shared/src/Logger";

export type EntityQuery = Set<ComponentConstructor>;

export class Entity extends Schema {
  private static nextId = 0;

  /**
   * The unique identifier of the entity.
   *
   * This should never be changed after the entity is created.
   */
  @type("string") public readonly id = `${Entity.nextId++}`;

  /**
   * The entities components.
   *
   * The key is the name of the component class. (component.constructor.name)
   *
   * The value is the component instance.
   *
   * @note Use the helper methods addComponent, removeComponent, getComponent, hasComponent to interact with this map.
   */
  @type({ map: Component }) public readonly components: MapSchema<Component> = new MapSchema<Component>();

  /**
   * Adds a component to the entity.
   *
   * If a component of the same type already exists, it will be replaced.
   *
   * @param component The component to add to the entity.
   */
  public addComponent<T extends Component>(component: T) {
    this.components.set(component.constructor.name, component);
  }

  /**
   * Removes a component from the entity.
   *
   * If the component does not exist, nothing will happen.
   *
   * @param component The component to remove from the entity.
   */
  public removeComponent<T extends Component>(component: new () => T) {
    if (!this.components.has(component.name)) {
      return;
    }

    this.components.delete(component.name);
  }

  /**
   * Gets a component from the entity.
   *
   * If the component does not exist, an error will be thrown.
   *
   * @param component The component to get from the entity.
   *
   * @returns The component instance.
   */
  public getComponent<T extends Component>(component: new () => T): T {
    if (!this.components.has(component.name)) {
      Logger.errorAndThrow("ECS", `Entity with id '${this.id}' does not have component '${component.name}'`);
    }

    return this.components.get(component.name) as T;
  }

  /**
   * Checks if the entity has a component.
   *
   * @param component The component to check for.
   *
   * @returns True if the entity has the component, false otherwise.
   */
  public hasComponent<T extends Component>(component: new () => T) {
    return this.components.has(component.name);
  }

  /**
   * Checks if the entity matches a query.
   *
   * An entity matches a query if it has all the components in the query.
   *
   * @param query The query to match against.
   *
   * @returns True if the entity matches the query, false otherwise.
   */
  public matchesQuery(query: EntityQuery) {
    for (const component of query) {
      if (!this.hasComponent(component)) {
        return false;
      }
    }

    return true;
  }
}
