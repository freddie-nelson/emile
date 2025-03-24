import { Assets, Sprite, Texture, TilingSprite, AnimatedSprite } from "pixi.js";
import { SpriteCreator, SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { CircleCollider, ColliderType, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity, EntityQuery } from "../../ecs/entity";
import { lerpTransform } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";
import { SpriteTag } from "../spriteTag";
import { createWorldTransform } from "../../scene/sceneGraph";

export enum SpriteImageType {
  SINGLE,
  TILE,
  ANIMATED,
}

export interface SingleSpriteImage {
  type: SpriteImageType.SINGLE | SpriteImageType.TILE;
  src: string;
  tileWidth?: number;
  tileHeight?: number;
  pixelated?: boolean;
}

export interface AnimatedSpriteImage {
  type: SpriteImageType.ANIMATED;
  src: string[];
  pixelated?: boolean;
  animationSpeed?: number;
  loop?: boolean;
  autoUpdate?: boolean;
}

export type SpriteImage = SingleSpriteImage | AnimatedSpriteImage;

/**
 * Creates sprites based on entities with the SpriteTag component.
 *
 * @note YOU MUST CALL `preloadTextures` BEFORE USING THE SPRITE CREATOR
 */
export default class SpriteSpriteCreator implements SpriteCreator {
  /**
   * The components that the entity must have to be processed by this creator.
   *
   * @note DO NOT TOUCH THIS UNLESS YOU KNOW WHAT YOU'RE DOING
   */
  public query: EntityQuery = new Set([Transform, SpriteTag]);

  private readonly spriteImageMap: Map<number, SpriteImage>;
  private readonly textureCache: Map<string, Texture>;
  private readonly createdSpriteTypeMap: Map<string, number>;

  constructor(spriteImageMap: Map<number, SpriteImage> = new Map()) {
    this.spriteImageMap = spriteImageMap;
    this.textureCache = new Map();
    this.createdSpriteTypeMap = new Map();
  }

  public readonly create: SpriteCreatorCreate = ({ app, registry, sceneGraph, world, entity }) => {
    const e = registry.get(entity);

    const transform = sceneGraph.getWorldTransform(e.id);
    const spriteTag = Entity.getComponent(e, SpriteTag);

    const collider = PhysicsWorld.getCollider(e);

    if (!this.spriteImageMap.has(spriteTag.spriteType)) {
      Logger.errorAndThrow(
        "RENDERER",
        `Sprite image map does not contain an image for type '${spriteTag.spriteType}'.`
      );
    }

    let width = 0;
    let height = 0;

    if (!collider) {
      width = spriteTag.overrideWidth;
      height = spriteTag.overrideHeight;
    } else {
      switch (collider.type) {
        case ColliderType.CIRCLE: {
          const circle = collider as CircleCollider;
          width = circle.radius * 2;
          height = circle.radius * 2;
          break;
        }
        case ColliderType.RECTANGLE: {
          const rect = collider as RectangleCollider;
          width = rect.width;
          height = rect.height;
          break;
        }
        case ColliderType.POLYGON:
          // ! TODO: Implement this at some point <3
          Logger.errorAndThrow("RENDERER", "Polygon colliders are not supported in sprite sprite creator.");
          break;
        default:
          Logger.errorAndThrow(
            "RENDERER",
            `Unsupported collider type in sprite sprite creator: ${collider.type}`
          );
          break;
      }
    }

    width = spriteTag.overrideWidth || width;
    height = spriteTag.overrideHeight || height;

    const image = this.spriteImageMap.get(spriteTag.spriteType)!;

    let s: Sprite | TilingSprite | AnimatedSprite;
    switch (image.type) {
      case SpriteImageType.SINGLE:
        s = new Sprite({
          texture: this.getTexture(image.src),
          width,
          height,
        });
        break;
      case SpriteImageType.TILE:
        if (typeof image.tileWidth !== "number" || typeof image.tileHeight !== "number") {
          Logger.errorAndThrow("RENDERER", "Tile image must have tileWidth and tileHeight defined.");

          // will never happen
          throw new Error("Unreachable code");
        }

        s = new TilingSprite({
          texture: this.getTexture(image.src),
          width,
          height,
        });
        (s as TilingSprite).tileScale.set(1 / image.tileWidth!, 1 / image.tileHeight!);
        break;
      case SpriteImageType.ANIMATED:
        s = new AnimatedSprite({
          textures: this.getTextureArray(image.src),
          width,
          height,
          autoUpdate: image.autoUpdate ?? true,
        });
        (s as AnimatedSprite).loop = image.loop ?? true;
        (s as AnimatedSprite).animationSpeed = image.animationSpeed ?? 1;
        (s as AnimatedSprite).play();
        break;
      default:
        Logger.errorAndThrow("RENDERER", "Unsupported sprite image type");

        // will never happen
        throw new Error("Unreachable code");
    }

    world.addChild(s);

    s.position.set(transform.position.x, transform.position.y);
    s.rotation = transform.rotation;
    s.scale.set(transform.scale.x, -transform.scale.y);
    s.zIndex = transform.zIndex;
    s.alpha = spriteTag.opacity;
    s.anchor.set(0.5);

    this.createdSpriteTypeMap.set(entity, spriteTag.spriteType);

    return s;
  };

  public readonly update: SpriteCreatorUpdate = (data) => {
    const { registry, app, sceneGraph, entity, sprite, dt } = data;

    const e = registry.get(entity);
    const s = sprite!;

    const transform = sceneGraph.getWorldTransform(e.id);
    const spriteTag = Entity.getComponent(e, SpriteTag);

    if (spriteTag.spriteType !== this.createdSpriteTypeMap.get(entity)) {
      return this.create(data);
    }

    const newTransform = lerpTransform(
      createWorldTransform(s.position, s.rotation, s.scale, s.zIndex, true),
      transform,
      CLIENT_LERP_RATE
    );
    s.position.set(newTransform.position.x, newTransform.position.y);
    s.scale.set(newTransform.scale.x, -newTransform.scale.y);
    s.rotation = newTransform.rotation;
    s.zIndex = transform.zIndex;

    s.alpha = spriteTag.opacity;
  };

  public readonly delete: SpriteCreatorDelete = ({ registry, app, entity, sprite }) => {
    sprite!.removeFromParent();
    sprite!.destroy();
  };

  /**
   * Preload textures into the sprite creator.
   *
   * @note YOU MUST CALL THIS BEFORE USING THE SPRITE CREATOR
   */
  public async preloadTextures() {
    for (const image of this.spriteImageMap.values()) {
      const sources =
        image.type === SpriteImageType.ANIMATED ? (image as AnimatedSpriteImage).src : [image.src];
      for (const src of sources) {
        const res = await Assets.load(src);
        if (image.pixelated) {
          res.source.scaleMode = "nearest";
        }

        this.textureCache.set(src, res);
      }
    }
  }

  protected getTextureFromType(spriteType: number) {
    const image = this.spriteImageMap.get(spriteType)!;
    if (!image) {
      Logger.errorAndThrow(
        "RENDERER",
        `Sprite image map does not contain an image for type '${spriteType}'.`
      );
    }

    if (typeof image.src === "string") {
      return this.getTexture(image.src);
    } else {
      return this.getTextureArray(image.src);
    }
  }

  protected getTexture(image: string) {
    return this.textureCache.get(image);
  }

  protected getTextureArray(image: string[]) {
    return image.map((i) => this.textureCache.get(i)!);
  }
}
