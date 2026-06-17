import { Vec2 } from "../../math/vec";
import { SpriteCreator, SpriteCreatorData } from "../renderer";
import { Assets, ContainerChild, Point, Sprite, Texture } from "pixi.js";
import { Logger } from "@shared/src/Logger";
import { Mouse } from "../../input/mouse";

/**
 * The options for the cursor sprite creator.
 */
export interface CursorSpriteCreatorOptions {
  /**
   * The path to the cursor image.
   */
  src: string;

  /**
   * The z-index of the cursor sprite.
   *
   * @default 9999
   */
  zIndex?: number;

  /**
   * Whether to use pixelated rendering for the cursor.
   *
   * @default false
   */
  pixelated?: boolean;

  /**
   * The width of the rendered cursor.
   *
   * In world units.
   *
   * @default 0.5
   */
  width?: number;

  /**
   * The height of the rendered cursor.
   *
   * In world units.
   *
   * @default 0.5
   */
  height?: number;

  /**
   * The offset of the cursor sprite from the mouse position.
   *
   * In world units.
   *
   * @default new Vec2(0, 0)
   */
  offset?: Vec2;

  /**
   * The smoothing (`1 - lerp rate`) of the cursor's position to the mouse position.
   *
   * 0 = no smoothing
   * 1 = full smoothing
   *
   * @default 0
   */
  smoothing?: number;
}

const defaultOptions: Partial<CursorSpriteCreatorOptions> = {
  zIndex: 9999,
  pixelated: false,
  width: 0.5,
  height: 0.5,
  offset: new Vec2(0, 0),
  smoothing: 0,
};

/**
 * A sprite creator for the cursor, will render a sprite that always follows the mouse.
 *
 * Makes use of `overrideQueryEntities` to run the sprite creator only one time on a fake entity.
 * This is because the cursor is not a real entity, but a client side sprite that follows the mouse.
 *
 * Make sure you call `preloadTexture()` before using this sprite creator.
 */
export default class CursorSpriteCreator extends SpriteCreator {
  private readonly options: Required<CursorSpriteCreatorOptions>;
  private texture: Texture | null = null;

  constructor(options: CursorSpriteCreatorOptions) {
    super(undefined, new Set([Math.random().toString().substring(2, 15)]));

    this.options = { ...defaultOptions, ...options } as Required<CursorSpriteCreatorOptions>;
  }

  public create({ world, entity }: SpriteCreatorData): ContainerChild {
    if (!this.texture) {
      Logger.errorAndThrow(
        "RENDERER",
        "Cursor texture not set. Please call preloadTexture() before before using the CursorSpriteCreator."
      );
      throw new Error(); // unreachable
    }

    const cursor = new Sprite({
      width: this.options.width,
      height: this.options.height,
      texture: this.texture!,
      anchor: new Point(0.5),
      zIndex: this.options.zIndex,
      position: Mouse.getWorldPos(),
    });
    world.addChild(cursor);

    return cursor;
  }

  public update({ world, entity, sprite }: SpriteCreatorData): ContainerChild | void {
    if (!sprite) {
      return;
    }

    const mousePos = Vec2.add(Mouse.getWorldPos(), this.options.offset);

    if (this.options.smoothing) {
      const newPos = Vec2.lerp(
        new Vec2(sprite.position.x, sprite.position.y),
        mousePos,
        1 - this.options.smoothing
      );
      sprite.position.x = newPos.x;
      sprite.position.y = newPos.y;
    } else {
      sprite.position.x = mousePos.x;
      sprite.position.y = mousePos.y;
    }
  }

  public delete({ world, sprite }: SpriteCreatorData): void {
    if (!sprite) {
      return;
    }

    world.removeChild(sprite);
    sprite.destroy();
  }

  public dispose(): void {
    if (this.texture) {
      Assets.unload(this.options.src);
    }
  }

  public async setCursor(src: string) {
    if (this.texture) {
      this.texture.destroy(true);
    }

    this.options.src = src;

    const res = await Assets.load(src);
    if (this.options.pixelated) {
      res.source.scaleMode = "nearest";
    }

    this.texture = res;
  }

  public async preloadTexture(): Promise<void> {
    if (!this.texture) {
      await this.setCursor(this.options.src);
    }
  }
}
