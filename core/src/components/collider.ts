import { Vec2 } from "../math/vec";
import { Component } from "@ecs/src/component";
import { type } from "@colyseus/schema";
import Matter from "matter-js";
import { RegistryType } from "@ecs/src/registry";
import { TypedBody } from "../matter";

export enum ColliderType {
  CIRCLE,
  RECTANGLE,
  POLYGON,
}

/**
 * Represents a collider component.
 *
 * See [here](https://brm.io/matter-js/docs/classes/Body.html#property_collisionFilter) for information on how collision filters are used.
 */
export abstract class Collider extends Component {
  @type("int8") public type: ColliderType;
  @type("boolean") public isSensor: boolean = false;
  @type("int32") public group: number = 1;
  @type("uint32") public category: number = 1;
  @type("int32") public mask: number = 1;

  protected body: TypedBody | null = null;

  constructor(registryType: RegistryType, type: ColliderType) {
    super();

    this.type = type;

    if (registryType === RegistryType.CLIENT) {
      this.onChange(() => {
        if (!this.body) {
          return;
        }

        this.body.isSensor = this.isSensor;
        this.body.collisionFilter.group = this.group;
        this.body.collisionFilter.category = this.category;
        this.body.collisionFilter.mask = this.mask;
      });
    }
  }

  /**
   * Sets the collider as a sensor.
   *
   * @param isSensor Wether or not the collider is a sensor.
   */
  public setSensor(isSensor: boolean) {
    this.isSensor = isSensor;

    if (this.body) {
      this.body.isSensor = isSensor;
    }
  }

  /**
   * Sets the collision category of the collider.
   *
   * @param group The collision group to set.
   */
  public setCollisionGroup(group: number) {
    this.group = group;

    if (this.body) {
      this.body.collisionFilter.group = group;
    }
  }

  /**
   * Sets the collision category of the collider.
   *
   * @param category The collision category to set.
   */
  public setCollisionCategory(category: number) {
    this.category = category;

    if (this.body) {
      this.body.collisionFilter.category = category;
    }
  }

  /**
   * Sets the collision mask of the collider.
   *
   * @param mask The collision mask to set.
   */
  public setCollisionMask(mask: number) {
    this.mask = mask;

    if (this.body) {
      this.body.collisionFilter.mask = mask;
    }
  }

  /**
   * Sets the matter body of the collider.
   *
   * @note This should only be called by the physics world.
   *
   * @param body The matter body to set.
   */
  public setBody(body: Matter.Body) {
    this.body = body;
  }

  /**
   * Gets the matter body of the collider.
   *
   * @note Only use this if you know what you are doing.
   *
   * @returns The matter body.
   */
  public getBody() {
    return this.body;
  }

  /**
   * Updates the collider component from the matter body.
   */
  public update() {}
}

export class CircleCollider extends Collider {
  @type("float32") public radius: number;

  /**
   * Creates a new circle collider.
   *
   * @param registryType The registry type.
   * @param radius The radius of the circle collider.
   */
  constructor(registryType: number, radius: number) {
    super(registryType, ColliderType.CIRCLE);

    this.radius = radius;

    if (registryType === RegistryType.CLIENT) {
      this.onChange(() => {
        if (!this.body || !this.body.plugin) {
          return;
        }

        if (this.body.plugin.circleRadius !== this.radius) {
          this.setRadius(this.radius);
        }
      });
    }
  }

  /**
   * Sets the radius of the circle collider.
   *
   * @param radius The radius to set.
   */
  public setRadius(radius: number) {
    this.radius = radius;
    this.body = null;
  }
}

export class RectangleCollider extends Collider {
  @type("float32") public width: number;
  @type("float32") public height: number;

  /**
   * Creates a new rectangle collider.
   *
   * @param registryType The registry type.
   * @param width The width of the rectangle.
   * @param height The height of the rectangle.
   */
  constructor(registryType: RegistryType, width: number, height: number) {
    super(registryType, ColliderType.RECTANGLE);

    this.width = width;
    this.height = height;

    if (registryType === RegistryType.CLIENT) {
      this.onChange(() => {
        if (!this.body || !this.body.plugin) {
          return;
        }

        if (
          this.body.plugin.rectangleWidth !== this.width ||
          this.body.plugin.rectangleHeight !== this.height
        ) {
          this.body = null;
        }
      });
    }
  }

  /**
   * Sets the width of the rectangle collider.
   *
   * @param width The width to set.
   */
  public setWidth(width: number) {
    this.width = width;
    this.body = null;
  }

  /**
   * Sets the height of the rectangle collider.
   *
   * @param height The height to set.
   */
  public setHeight(height: number) {
    this.height = height;
    this.body = null;
  }
}

export class PolygonCollider extends Collider {
  @type([Vec2]) public vertices: Vec2[];

  /**
   * Creates a new polygon collider.
   *
   * @param registryType The registry type.
   * @param vertices The vertices of the polygon collider.
   */
  constructor(registryType: RegistryType, vertices: Vec2[]) {
    super(registryType, ColliderType.POLYGON);

    this.vertices = vertices;

    if (registryType === RegistryType.CLIENT) {
      this.onChange(() => {
        if (!this.body || !this.body.plugin) {
          return;
        }

        if (this.body.plugin.polygonVertices?.length !== this.vertices.length) {
          this.body = null;
        } else if (
          this.body.plugin.polygonVertices?.some(
            (v, i) => v.x !== this.vertices[i].x || v.y !== this.vertices[i].y
          )
        ) {
          this.body = null;
        }
      });
    }
  }

  /**
   * Sets the vertices of the polygon collider.
   *
   * @param vertices The vertices to set.
   */
  public setVertices(vertices: Vec2[]) {
    this.vertices = vertices;
    this.body = null;
  }
}
