import { Schema, type } from "@colyseus/schema";

/**
 * A component is a piece of data that can be attached to an entity.
 *
 * An important fact to note is that components must be serializable. However, once the component
 * is transferred over the wire, it loses it's prototype. This means that any methods or properties
 * that are not annotated with `@type` will not be available on the client. DO NOT TRY TO SERIALISE METHODS!
 *
 * Use static methods that take the component instance as an argument instead, and only use properties which are annotated with `@type`.
 */
export abstract class Component extends Schema {
  /**
   * The unique identifier of the component.
   *
   * You must set this value to the unique identifier of the component.
   *
   * This is required to identify the component on an entity, between the client and server.
   *
   * This should be the same on the client and server across all instances of the same component.
   *
   * @note The id must be between 0 and 190 (inclusive), 191 - 255 are reserved for the engine.
   */
  public static readonly COMPONENT_ID: number = -1;

  @type("uint8") public readonly componentId: number;

  constructor(componentId: number) {
    super();

    this.componentId = componentId;
  }
}

export type ComponentConstructor = new (...args: any[]) => Component;

export type GenericComponentConstructor<T extends Component> = new (...args: any[]) => T;

export function getComponentIdFromConstructor<T extends Component>(
  component: GenericComponentConstructor<T>
): string {
  const id = (component as any)["COMPONENT_ID"] as number;
  if (typeof id !== "number") {
    throw new Error(`Component ${component.name} does not have a COMPONENT_ID static property.`);
  }

  return id.toString();
}

export function getComponentIdFromInstance(component: Component): string {
  const id = component.componentId;
  if (typeof id !== "number") {
    throw new Error(
      `${component.constructor.name} component instance does not have a valid componentId got '${id}' expected number.`
    );
  }

  return id.toString();
}
