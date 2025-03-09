import { MapSchema, Schema, type } from "@colyseus/schema";
import {
	Component,
	ComponentConstructor,
	GenericComponentConstructor,
	getComponentIdFromConstructor,
	getComponentIdFromInstance,
} from "./component";
import { Logger } from "@shared/src/Logger";

export type EntityQuery = Set<ComponentConstructor>;

export class Entity extends Schema {
	// ! TODO: change this to be per room/engine instance
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
	 * The key is retrieved using `getComponentIdFromConstructor` or `getComponentIdFromInstance`.
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
	 * @param entity The entity to add the component to.
	 * @param component The component to add to the entity.
	 *
	 * @returns The component instance.
	 *
	 * @warning This should only be called by the registry, use the `add` method on the registry instead.
	 */
	public static addComponent<T extends Component>(entity: Entity, component: T): T {
		const id = getComponentIdFromInstance(component);

		entity.components.set(id, component);
		return component;
	}

	/**
	 * Removes a component from the entity.
	 *
	 * If the component does not exist, nothing will happen.
	 *
	 * @param entity The entity.
	 * @param component The component to remove from the entity.
	 *
	 * @warning This should only be called by the registry, use the `remove` method on the registry instead.
	 */
	public static removeComponent<T extends Component>(entity: Entity, component: GenericComponentConstructor<T>) {
		const id = getComponentIdFromConstructor(component);
		if (!entity.components.has(id)) {
			return;
		}

		entity.components.delete(id);
	}

	/**
	 * Gets a component from the entity.
	 *
	 * If the component does not exist, an error will be thrown.
	 *
	 * @param entity The entity.
	 * @param component The component to get from the entity.
	 *
	 * @returns The component instance.
	 *
	 * @throws An error if the entity does not have the component.
	 */
	public static getComponent<T extends Component>(entity: Entity, component: GenericComponentConstructor<T>): T {
		const id = getComponentIdFromConstructor(component);
		if (!entity.components.has(id)) {
			Logger.errorAndThrow("ECS", `Entity with id '${entity.id}' does not have component '${component.name}'`);
		}

		return entity.components.get(id) as T;
	}

	public static getComponentOrNull<T extends Component>(
		entity: Entity,
		component: GenericComponentConstructor<T>
	): T | null {
		const id = getComponentIdFromConstructor(component);
		return (entity.components.get(id) as T) || null;
	}

	/**
	 * Checks if the entity has a component.
	 *
	 * @param entity The entity.
	 * @param component The component to check for.
	 *
	 * @returns True if the entity has the component, false otherwise.
	 */
	public static hasComponent<T extends Component>(entity: Entity, component: GenericComponentConstructor<T>) {
		const id = getComponentIdFromConstructor(component);
		return entity.components.has(id);
	}

	/**
	 * Checks if the entity matches a query.
	 *
	 * An entity matches a query if it has all the components in the query.
	 *
	 * @param entity The entity.
	 * @param query The query to match against.
	 *
	 * @returns True if the entity matches the query, false otherwise.
	 */
	public static matchesQuery(entity: Entity, query: EntityQuery) {
		for (const component of query) {
			if (!Entity.hasComponent(entity, component)) {
				return false;
			}
		}

		return true;
	}
}
