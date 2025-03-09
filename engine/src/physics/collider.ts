import { Vec2 } from "../math/vec";
import { Component } from "../ecs/component";
import { type } from "@colyseus/schema";
import Matter from "matter-js";
import { TypedBody } from "../matter";
import { Entity } from "../ecs/entity";

export enum ColliderType {
  CIRCLE,
  RECTANGLE,
  POLYGON,
}

export enum ColliderEvent {
  COLLISION_START,
  COLLISION_ACTIVE,
  COLLISION_END,
  COLLISION_START_INSTANT,
  COLLISION_ACTIVE_INSTANT,
  COLLISION_END_INSTANT,
}

/**
 * Represents a collision callback.
 *
 * @note Entity a will always be the entity that has the collider the callback is attached to.
 */
export type CollisionCallback = (pair: Matter.Pair, a: Entity, b: Entity) => void;

/**
 * Represents a collider component.
 *
 * See [here](https://brm.io/matter-js/docs/classes/Body.html#property_collisionFilter) for information on how collision filters are used.
 */
export abstract class Collider extends Component {
  public static onComponentAdded(entity: Entity, component: Component) {
    const collider = component as Collider;

    collider.onChange(() => {
      if (!collider.body) {
        return;
      }

      collider.body.isSensor = collider.isSensor;
      collider.body.collisionFilter.group = collider.group;
      collider.body.collisionFilter.category = collider.category;
      collider.body.collisionFilter.mask = collider.mask;
    });
  }

  @type("int8") public type: ColliderType;
  @type("boolean") public isSensor: boolean = false;
  @type("int32") public group: number = 0;
  @type("uint32") public category: number = 1;
  @type("int32") public mask: number = 4294967295;

  /**
   * The matter body of the collider.
   *
   * @warning DO NOT TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING.
   */
  public body?: TypedBody;

  private collisionCallbacks?: Map<ColliderEvent, CollisionCallback[]>;

  constructor(componentId: number, type: ColliderType) {
    super(componentId);

    this.type = type;
  }

  /**
   * Sets the collider as a sensor.
   *
   * @param collider The collider.
   * @param isSensor Wether or not the collider is a sensor.
   */
  public static setSensor(collider: Collider, isSensor: boolean) {
    collider.isSensor = isSensor;

    if (collider.body) {
      collider.body.isSensor = isSensor;
    }
  }

  /**
   * Sets the collision category of the collider.
   *
   * @param collider The collider.
   * @param group The collision group to set.
   */
  public static setCollisionGroup(collider: Collider, group: number) {
    collider.group = group;

    if (collider.body) {
      collider.body.collisionFilter.group = group;
    }
  }

  /**
   * Sets the collision category of the collider.
   *
   * @param collider The collider.
   * @param category The collision category to set.
   */
  public static setCollisionCategory(collider: Collider, category: number) {
    collider.category = category;

    if (collider.body) {
      collider.body.collisionFilter.category = category;
    }
  }

  /**
   * Sets the collision mask of the collider.
   *
   * @param collider The collider.
   * @param mask The collision mask to set.
   */
  public static setCollisionMask(collider: Collider, mask: number) {
    collider.mask = mask;

    if (collider.body) {
      collider.body.collisionFilter.mask = mask;
    }
  }

  /**
   * Adds a collision event listener.
   *
   * @param collider The collider.
   * @param event The event to listen for.
   * @param callback The callback to call when the event is triggered.
   */
  public static on(collider: Collider, event: ColliderEvent, callback: CollisionCallback) {
    if (!collider.collisionCallbacks) {
      collider.collisionCallbacks = new Map();
    }

    if (!collider.collisionCallbacks.has(event)) {
      collider.collisionCallbacks.set(event, []);
    }

    collider.collisionCallbacks.get(event)?.push(callback);
  }

  /**
   * Removes a collision event listener.
   *
   * @param collider The collider.
   * @param event The event to remove the callback from.
   * @param callback The callback to remove.
   */
  public static off(collider: Collider, event: ColliderEvent, callback: CollisionCallback) {
    if (!collider.collisionCallbacks) {
      collider.collisionCallbacks = new Map();
    }

    if (!collider.collisionCallbacks.has(event)) {
      return;
    }

    const callbacks = collider.collisionCallbacks.get(event)!;
    collider.collisionCallbacks.set(
      event,
      callbacks.filter((cb) => cb !== callback)
    );
  }

  /**
   * Fires a collision event.
   *
   * @note This should only be called by the physics world.
   *
   * @note Entity a should be the entity that has this collider.
   *
   * @param collider The collider.
   * @param event The event to fire.
   * @param pair The matter pair
   * @param a The first entity
   * @param b The second entity
   */
  public static fire(collider: Collider, event: ColliderEvent, pair: Matter.Pair, a: Entity, b: Entity) {
    if (!collider.collisionCallbacks) {
      collider.collisionCallbacks = new Map();
    }

    if (!collider.collisionCallbacks.has(event)) {
      return;
    }

    collider.collisionCallbacks.get(event)?.forEach((callback) => callback(pair, a, b));
  }

  /**
   * Sets the matter body of the collider.
   *
   * @note This should only be called by the physics world.
   *
   * @param collider The collider.
   * @param body The matter body to set.
   */
  public static setBody(collider: Collider, body: TypedBody | undefined) {
    collider.body = body;
  }

  /**
   * Gets the matter body of the collider.
   *
   * @note Only use this if you know what you are doing.
   *
   * @param collider The collider.
   *
   * @returns The matter body.
   */
  public static getBody(collider: Collider) {
    return collider.body;
  }

  /**
   * Updates the collider component from the matter body.
   *
   * @param collider The collider.
   */
  public static update(collider: Collider) {}
}

export class CircleCollider extends Collider {
  public static readonly COMPONENT_ID = 192;

  public static onComponentAdded(entity: Entity, component: Component) {
    Collider.onComponentAdded(entity, component);

    const collider = component as CircleCollider;

    collider.onChange(() => {
      if (!collider.body || !collider.body.plugin) {
        return;
      }

      if (collider.body.plugin.circleRadius !== collider.radius) {
        collider.body = undefined;
      }
    });
  }

  @type("float32") public radius: number;

  /**
   * Creates a new circle collider.
   *
   * @param radius The radius of the circle collider.
   */
  constructor(radius: number) {
    super(CircleCollider.COMPONENT_ID, ColliderType.CIRCLE);

    this.radius = radius;
  }

  /**
   * Sets the radius of the circle collider.
   *
   * @param collider The collider.
   * @param radius The radius to set.
   */
  public static setRadius(collider: CircleCollider, radius: number) {
    collider.radius = radius;
    collider.body = undefined;
  }
}

export class RectangleCollider extends Collider {
  public static readonly COMPONENT_ID = 193;

  public static onComponentAdded(entity: Entity, component: Component) {
    Collider.onComponentAdded(entity, component);

    const collider = component as RectangleCollider;

    collider.onChange(() => {
      if (!collider.body || !collider.body.plugin) {
        return;
      }

      if (
        collider.body.plugin.rectangleWidth !== collider.width ||
        collider.body.plugin.rectangleHeight !== collider.height
      ) {
        collider.body = undefined;
      }
    });
  }

  @type("float32") public width: number;
  @type("float32") public height: number;

  /**
   * Creates a new rectangle collider.
   *
   * @param width The width of the rectangle.
   * @param height The height of the rectangle.
   */
  constructor(width: number, height: number) {
    super(RectangleCollider.COMPONENT_ID, ColliderType.RECTANGLE);

    this.width = width;
    this.height = height;
  }

  /**
   * Sets the width of the rectangle collider.
   *
   * @param collider The collider.
   * @param width The width to set.
   */
  public static setWidth(collider: RectangleCollider, width: number) {
    collider.width = width;
    collider.body = undefined;
  }

  /**
   * Sets the height of the rectangle collider.
   *
   * @param collider The collider.
   * @param height The height to set.
   */
  public static setHeight(collider: RectangleCollider, height: number) {
    collider.height = height;
    collider.body = undefined;
  }
}

export class PolygonCollider extends Collider {
  public static readonly COMPONENT_ID = 194;

  public static onComponentAdded(entity: Entity, component: Component) {
    Collider.onComponentAdded(entity, component);

    const collider = component as PolygonCollider;

    collider.onChange(() => {
      if (!collider.body || !collider.body.plugin) {
        return;
      }

      if (collider.body.plugin.polygonVertices?.length !== collider.vertices.length) {
        collider.body = undefined;
      } else if (
        collider.body.plugin.polygonVertices?.some(
          (v, i) => v.x !== collider.vertices[i].x || v.y !== collider.vertices[i].y
        )
      ) {
        collider.body = undefined;
      }
    });
  }

  @type([Vec2]) public vertices: Vec2[];

  /**
   * Creates a new polygon collider.
   *
   * @param vertices The vertices of the polygon collider.
   */
  constructor(vertices: Vec2[]) {
    super(PolygonCollider.COMPONENT_ID, ColliderType.POLYGON);

    this.vertices = vertices;
  }

  /**
   * Sets the vertices of the polygon collider.
   *
   * @param collider The collider.
   * @param vertices The vertices to set.
   */
  public static setVertices(collider: PolygonCollider, vertices: Vec2[]) {
    collider.vertices = vertices;
    collider.body = undefined;
  }
}
