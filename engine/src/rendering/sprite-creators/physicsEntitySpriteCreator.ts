import { ColorSource, ContainerChild, Graphics } from "pixi.js";
import { SpriteCreator, SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { Rigidbody } from "../../physics/rigidbody";
import { CircleCollider, ColliderType, PolygonCollider, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity, EntityQuery } from "../../ecs/entity";
import { ColorTag } from "../colorTag";
import { Vec2 } from "../../math/vec";
import { lerpTransform } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";
import { createWorldTransform } from "../../scene/sceneGraph";

export default class PhysicsEntitySpriteCreator implements SpriteCreator {
  public readonly query: EntityQuery = new Set([Transform, Rigidbody]);
  private readonly oldScales: Map<string, Vec2> = new Map();

  private readonly defaultColor: ColorSource;
  private readonly defaultOpacity: number;
  private readonly zIndex?: number;
  private readonly rigidbodyRadius: number;
  private readonly rigidbodyOpacity: number;

  constructor(
    defaultColor: ColorSource,
    defaultOpacity: number,
    zIndex: number | undefined = undefined,
    rigidbodyRadius = 0.1,
    rigidbodyOpacity = 0.5
  ) {
    this.defaultColor = defaultColor;
    this.defaultOpacity = defaultOpacity;
    this.zIndex = zIndex;
    this.rigidbodyRadius = rigidbodyRadius;
    this.rigidbodyOpacity = rigidbodyOpacity;
  }

  public readonly create: SpriteCreatorCreate = ({ registry, sceneGraph, world, entity }) => {
    const e = registry.get(entity);

    const transform = sceneGraph.getWorldTransform(entity);
    const collider = PhysicsWorld.getCollider(e);
    const colorTag = Entity.getComponentOrNull(e, ColorTag);

    const s = new Graphics();
    world.addChild(s);

    s.position.set(transform.position.x, transform.position.y);

    s.rotation = transform.rotation;
    s.zIndex = this.zIndex ?? transform.zIndex;

    this.oldScales.set(entity, Vec2.copy(transform.scale));

    if (!collider) {
      s.circle(0, 0, this.rigidbodyRadius);
      s.alpha = this.rigidbodyOpacity;
      s.fill(colorTag?.color || this.defaultColor);
      return s;
    }

    switch (collider.type) {
      case ColliderType.CIRCLE: {
        const circle = collider as CircleCollider;
        s.ellipse(0, 0, circle.radius * transform.scale.x, circle.radius * transform.scale.y);
        break;
      }
      case ColliderType.RECTANGLE: {
        const rect = collider as RectangleCollider;
        s.rect(0, 0, rect.width * transform.scale.x, rect.height * transform.scale.y);
        break;
      }
      case ColliderType.POLYGON: {
        const poly = collider as PolygonCollider;
        s.poly(poly.vertices.map((v) => ({ x: v.x * transform.scale.x, y: v.y * transform.scale.y })));
        break;
      }
      default: {
        Logger.errorAndThrow(
          "RENDERER",
          `Unsupported collider type in physics entity sprite creator: ${collider.type}`
        );
      }
    }

    s.fill(colorTag?.color || this.defaultColor);
    s.alpha = this.defaultOpacity;

    this.setPivot(s, collider.type);

    return s;
  };

  public readonly update: SpriteCreatorUpdate = (data) => {
    const { registry, sceneGraph, entity, sprite } = data;

    const e = registry.get(entity);
    const s = sprite!;

    const collider = PhysicsWorld.getCollider(e);
    const transform = sceneGraph.getWorldTransform(entity);

    const oldScale = this.oldScales.get(entity)!;
    if (oldScale.x !== transform.scale.x || oldScale.y !== transform.scale.y) {
      return this.create(data);
    }

    const newTransform = lerpTransform(
      createWorldTransform(s.position, s.rotation, s.scale, s.zIndex),
      transform,
      CLIENT_LERP_RATE
    );
    s.position.set(newTransform.position.x, newTransform.position.y);
    s.rotation = newTransform.rotation;
    s.zIndex = this.zIndex ?? transform.zIndex;

    this.setPivot(s, collider?.type);
  };

  public readonly delete: SpriteCreatorDelete = ({ registry, app, entity, sprite }, replacing) => {
    sprite!.removeFromParent();
    sprite!.destroy();

    if (!replacing) {
      this.oldScales.delete(entity);
    }
  };

  private setPivot(s: ContainerChild, colliderType?: ColliderType) {
    if (colliderType === ColliderType.CIRCLE) {
      s.pivot.set(0, 0);
    } else {
      s.pivot.set(s.width / 2, s.height / 2);
    }
  }
}
