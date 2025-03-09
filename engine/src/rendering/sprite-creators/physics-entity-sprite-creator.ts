import { Color, ColorSource, ContainerChild, Graphics } from "pixi.js";
import { SpriteCreator, SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { Rigidbody } from "../../physics/rigidbody";
import { CircleCollider, ColliderType, PolygonCollider, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity } from "../../ecs/entity";
import { ColorTag } from "../colorTag";
import { Vec2 } from "../../math/vec";
import { lerp } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";

export default class PhysicsEntitySpriteCreator implements SpriteCreator {
  public readonly query = new Set([Transform, Rigidbody]);

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

  public readonly create: SpriteCreatorCreate = ({ registry, world, entity }) => {
    const e = registry.get(entity);

    const transform = Entity.getComponent(e, Transform);
    const collider = PhysicsWorld.getCollider(e);
    const colorTag = Entity.getComponentOrNull(e, ColorTag);

    const s = new Graphics();
    world.addChild(s);

    const position = Vec2.lerp(new Vec2(s.position.x, s.position.y), transform.position, 0.2);
    s.position.set(position.x, position.y);

    s.rotation = transform.rotation;
    s.scale.set(transform.scale.x, transform.scale.y);
    s.zIndex = this.zIndex ?? transform.zIndex;

    if (!collider) {
      s.circle(0, 0, this.rigidbodyRadius);
      s.alpha = this.rigidbodyOpacity;
      s.fill(colorTag?.color || this.defaultColor);
      s.pivot.set(0, 0);
      return s;
    }

    switch (collider.type) {
      case ColliderType.CIRCLE: {
        const circle = collider as CircleCollider;
        s.circle(0, 0, circle.radius);
        break;
      }
      case ColliderType.RECTANGLE: {
        const rect = collider as RectangleCollider;
        s.rect(0, 0, rect.width, rect.height);
        break;
      }
      case ColliderType.POLYGON: {
        const poly = collider as PolygonCollider;
        s.poly(poly.vertices);
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

  public readonly update: SpriteCreatorUpdate = ({ registry, app, entity, sprite, dt }) => {
    const e = registry.get(entity);
    const s = sprite!;

    const collider = PhysicsWorld.getCollider(e);
    const transform = Entity.getComponent(e, Transform);

    const position = Vec2.lerp(new Vec2(s.position.x, s.position.y), transform.position, CLIENT_LERP_RATE);
    s.position.set(position.x, position.y);

    s.rotation = lerp(s.rotation, transform.rotation, CLIENT_LERP_RATE);
    s.scale.set(transform.scale.x, transform.scale.y);
    s.zIndex = this.zIndex ?? transform.zIndex;

    this.setPivot(s, collider?.type);
  };

  public readonly delete: SpriteCreatorDelete = ({ registry, app, entity, sprite }) => {
    sprite!.removeFromParent();
    sprite!.destroy();
  };

  private setPivot(s: ContainerChild, colliderType?: ColliderType) {
    if (colliderType === ColliderType.CIRCLE) {
      s.pivot.set(0, 0);
    } else {
      s.pivot.set(s.width / 2, s.height / 2);
    }
  }
}
