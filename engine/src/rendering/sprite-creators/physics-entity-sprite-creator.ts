import { ColorSource, ContainerChild, Graphics } from "pixi.js";
import { SpriteCreator, SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { Rigidbody } from "../../physics/rigidbody";
import { CircleCollider, ColliderType, PolygonCollider, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity } from "../../ecs/entity";

export default class PhysicsEntitySpriteCreator implements SpriteCreator {
  public readonly query = new Set([Transform, Rigidbody]);

  private readonly color: ColorSource;
  private readonly rigidbodyRadius: number;
  private readonly rigidbodyOpacity: number;

  constructor(color: ColorSource, rigidbodyRadius = 0.1, rigidbodyOpacity = 0.5) {
    this.color = color;
    this.rigidbodyRadius = rigidbodyRadius;
    this.rigidbodyOpacity = rigidbodyOpacity;
  }

  public readonly create: SpriteCreatorCreate = ({ registry, app, entity }) => {
    const e = registry.get(entity);

    const transform = Entity.getComponent(e, Transform);
    const collider = PhysicsWorld.getCollider(e);

    const s = new Graphics();
    app.stage.addChild(s);

    s.position.set(transform.position.x, transform.position.y);
    s.rotation = transform.rotation;
    s.scale.set(transform.scale.x, transform.scale.y);
    s.zIndex = transform.zIndex;

    if (!collider) {
      s.circle(0, 0, this.rigidbodyRadius);
      s.alpha = this.rigidbodyOpacity;
      s.fill(this.color);
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

    s.fill(this.color);

    this.setPivot(s, collider.type);

    return s;
  };

  public readonly update: SpriteCreatorUpdate = ({ registry, app, entity, sprite, dt }) => {
    const e = registry.get(entity);
    const s = sprite!;

    const collider = PhysicsWorld.getCollider(e);
    const transform = Entity.getComponent(e, Transform);

    s.position.set(transform.position.x, transform.position.y);
    s.rotation = transform.rotation;
    s.scale.set(transform.scale.x, transform.scale.y);
    s.zIndex = transform.zIndex;

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
