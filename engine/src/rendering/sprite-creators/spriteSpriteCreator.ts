import { Assets, Sprite, Texture, TilingSprite, AnimatedSprite, Container, ContainerChild } from "pixi.js";
import { SpriteCreator, SpriteCreatorData } from "../renderer";
import { CircleCollider, Collider, ColliderType, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity, EntityQuery } from "../../ecs/entity";
import { lerpTransform } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";
import { SpriteTag } from "../spriteTag";
import { createWorldTransform } from "../../scene/sceneGraph";
import AnimatedTilingSprite from "../helpers/AnimatedTilingSprite";
import { ColorTag } from "../colorTag";

export enum SpriteImageType {
  SINGLE,
  TILE,
  ANIMATED,
  ANIMATED_TILE,
}

export interface SingleSpriteImage {
  type: SpriteImageType.SINGLE;
  src: string;
  pixelated?: boolean;
}

export interface TileSpriteImage {
  type: SpriteImageType.TILE;
  src: string;
  tileWidth: number;
  tileHeight: number;
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

export interface AnimatedTileSpriteImage {
  type: SpriteImageType.ANIMATED_TILE;
  src: string[];
  tileWidth: number;
  tileHeight: number;
  pixelated?: boolean;
  loop?: boolean;
  autoUpdate?: boolean;
  animationSpeed?: number;
}

export type SpriteImage = SingleSpriteImage | AnimatedSpriteImage | TileSpriteImage | AnimatedTileSpriteImage;

/**
 * Creates sprites based on entities with the SpriteTag component.
 *
 * You can also tint/change the opacity of the sprite using the ColorTag component.
 *
 * @note YOU MUST CALL `preloadTextures` BEFORE USING THE SPRITE CREATOR
 */
export default class SpriteSpriteCreator extends SpriteCreator {
  private readonly spriteImageMap: Map<number, SpriteImage>;
  private readonly textureCache: Map<string, Texture>;
  private readonly createdSpriteTypeMap: Map<string, number>;

  constructor(
    spriteImageMap: Map<number, SpriteImage> = new Map(),
    query: EntityQuery = new Set([Transform, SpriteTag]),
  ) {
    super(query);

    this.spriteImageMap = spriteImageMap;
    this.textureCache = new Map();
    this.createdSpriteTypeMap = new Map();
  }

  public create({ app, registry, sceneGraph, world, entity }: SpriteCreatorData) {
    const e = registry.get(entity);

    const transform = sceneGraph.getWorldTransform(e.id);
    const spriteTag = Entity.getComponent(e, SpriteTag);
    const colorTag = Entity.getComponentOrNull(e, ColorTag);

    const collider = PhysicsWorld.getCollider(e);

    if (!this.spriteImageMap.has(spriteTag.spriteType)) {
      Logger.errorAndThrow(
        "RENDERER",
        `Sprite image map does not contain an image for type '${spriteTag.spriteType}'.`,
      );
    }

    const { width, height } = this.calculateSpriteSize(spriteTag, collider);
    const s = this.createSprite(spriteTag.spriteType, width, height);

    const container = new Container();
    container.addChild(s);
    world.addChild(container);

    container.position.set(transform.position.x, transform.position.y);
    container.rotation = transform.rotation;
    container.scale.set(transform.scale.x, -transform.scale.y);
    container.zIndex = transform.zIndex;
    container.pivot.set(container.width / 2, container.height / 2);

    s.anchor.set(0.5);
    s.position.set(container.width / 2, container.height / 2);

    container.alpha = colorTag?.color ?? spriteTag.opacity;
    container.tint = colorTag?.color ?? 0xffffff;

    this.createdSpriteTypeMap.set(entity, spriteTag.spriteType);

    return container;
  }

  public update(data: SpriteCreatorData): ContainerChild | void {
    const { registry, sceneGraph, entity, sprite } = data;

    const e = registry.get(entity);
    const s = sprite!;

    const transform = sceneGraph.getWorldTransform(e.id);
    const spriteTag = Entity.getComponent(e, SpriteTag);
    const colorTag = Entity.getComponentOrNull(e, ColorTag);

    if (spriteTag.spriteType !== this.createdSpriteTypeMap.get(entity)) {
      return this.create(data);
    }

    const newTransform = lerpTransform(
      createWorldTransform(s.position, s.rotation, s.scale, s.zIndex, true),
      transform,
      CLIENT_LERP_RATE,
    );
    s.position.set(newTransform.position.x, newTransform.position.y);
    s.rotation = newTransform.rotation;
    s.scale.set(newTransform.scale.x, -newTransform.scale.y);
    s.zIndex = transform.zIndex;

    s.pivot.set(s.width / 2, s.height / 2);
    s.children[0].position.set(s.width / 2, s.height / 2);

    s.alpha = colorTag?.opacity ?? spriteTag.opacity;
    s.tint = colorTag?.color ?? 0xffffff;
  }

  public delete({ registry, app, entity, sprite }: SpriteCreatorData): void {
    sprite!.removeFromParent();
    sprite!.destroy();
  }

  public dispose() {
    for (const image of this.spriteImageMap.values()) {
      const sources =
        image.type === SpriteImageType.ANIMATED || image.type === SpriteImageType.ANIMATED_TILE
          ? (image as AnimatedSpriteImage | AnimatedTileSpriteImage).src
          : [image.src];

      for (const src of sources) {
        Assets.unload(src);
      }
    }
  }

  /**
   * Preload textures into the sprite creator.
   *
   * @note YOU MUST CALL THIS BEFORE USING THE SPRITE CREATOR
   */
  public async preloadTextures() {
    try {
      await Promise.all(
        Array.from(this.spriteImageMap.values()).map(async (image) => {
          const sources =
            image.type === SpriteImageType.ANIMATED || image.type === SpriteImageType.ANIMATED_TILE
              ? (image as AnimatedSpriteImage | AnimatedTileSpriteImage).src
              : [image.src];
          for (const src of sources) {
            const res = await Assets.load(src);
            if (image.pixelated) {
              res.source.scaleMode = "nearest";
            }

            this.textureCache.set(src, res);
          }
        }),
      );
    } catch (error) {
      Logger.errorAndThrow("RENDERER", "Failed to preload textures for SpriteSpriteCreator.", error);
    }
  }

  /**
   * Creates a sprite based on the sprite type.
   *
   * @param spriteType The sprite type to create
   * @param width The width of the sprite
   * @param height The height of the sprite
   *
   * @returns The created sprite
   */
  public createSprite(spriteType: number, width: number, height: number) {
    const image = this.spriteImageMap.get(spriteType)!;

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

      case SpriteImageType.ANIMATED_TILE:
        s = new AnimatedTilingSprite({
          textures: this.getTextureArray(image.src),
          width,
          height,
          autoUpdate: image.autoUpdate ?? true,
          loop: image.loop ?? true,
          animationSpeed: image.animationSpeed ?? 1,
          autoPlay: true,
        });
        (s as AnimatedTilingSprite).tileScale.set(1 / image.tileWidth!, 1 / image.tileHeight!);
        break;

      default:
        Logger.errorAndThrow("RENDERER", "Unsupported sprite image type");

        // will never happen
        throw new Error("Unreachable code");
    }

    s.anchor.set(0.5);

    return s;
  }

  /**
   * Calculates the size of a sprite based on its collider and the sprite tag's override width and height.
   *
   * @param spriteTag The sprite tag to calculate the size for
   * @param collider The collider to use for the size calculation. If not provided, the size will be based on the sprite tag's override width and height.
   *
   * @returns The width and height of the sprite.
   */
  public calculateSpriteSize(spriteTag: SpriteTag, collider: Collider | null = null) {
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
            `Unsupported collider type in sprite sprite creator: ${collider.type}`,
          );
          break;
      }
    }

    width = spriteTag.overrideWidth || width;
    height = spriteTag.overrideHeight || height;

    return {
      width,
      height,
    };
  }

  protected getTextureFromType(spriteType: number) {
    const image = this.spriteImageMap.get(spriteType)!;
    if (!image) {
      Logger.errorAndThrow(
        "RENDERER",
        `Sprite image map does not contain an image for type '${spriteType}'.`,
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
