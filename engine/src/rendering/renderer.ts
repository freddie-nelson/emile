import { System, SystemType } from "@ecs/src/system";
import { Transform } from "../core/transform";
import { Registry } from "@ecs/src/registry";
import { Entity, EntityQuery } from "@ecs/src/entity";
import { Application, ColorSource, Sprite } from "pixi.js";
import { Logger } from "@shared/src/Logger";

export interface RendererOptions {
  /**
   * Wether or not to automatically initialize the renderer.
   *
   * @default true
   */
  autoInit?: boolean;

  /**
   * The parent element to attach the renderer to.
   *
   * @default document.body
   */
  parentElement?: HTMLElement;

  /**
   * The width of the renderer.
   *
   * If set to -1, the width will be the same as the parent element.
   *
   * @default -1
   */
  width?: number;

  /**
   * The height of the renderer.
   *
   * If set to -1, the height will be the same as the parent element.
   *
   * @default -1
   */
  height?: number;

  /**
   * Wether or not to auto size the renderer to the parent element.
   *
   * @default true
   */
  autoSize?: boolean;

  /**
   * The background color of the renderer.
   *
   * @default "black"
   */
  backgroundColor?: ColorSource;

  /**
   * The renderer's root scale.
   *
   * e.g. 50 means 1 unit in the game world is 50 pixels on the screen.
   *
   * @default 50
   */
  scale?: number;
}

const defaultRendererOptions: Partial<RendererOptions> = {
  autoInit: true,
  parentElement: document.body,
  width: -1,
  height: -1,
  autoSize: true,
  backgroundColor: "black",
  scale: 50,
};

export interface SpriteCreator {
  readonly query?: EntityQuery;
  readonly create?: (registry: Registry, entity: Entity) => Sprite;
  readonly update?: (registry: Registry, entity: Entity, sprite: Sprite, dt: number) => void;
  readonly delete?: (registry: Registry, entity: Entity, sprite: Sprite) => void;
}

/**
 * The renderer system.
 *
 * The renderer has a system priority of 0.
 */
export class Renderer extends System {
  private readonly options: Required<RendererOptions>;
  private readonly sprites: Map<Entity, Map<SpriteCreator, Sprite>> = new Map();
  private readonly spriteCreators: Set<SpriteCreator> = new Set();

  private initialized = false;
  private app: Application | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Creates a new renderer.
   *
   * @param options The options for the renderer.
   */
  constructor(options: RendererOptions) {
    super(SystemType.CLIENT, new Set([Transform]), 0);

    this.options = { ...defaultRendererOptions, ...options } as Required<RendererOptions>;

    if (this.options.autoInit) {
      this.init();
    }
  }

  public update = (registry: Registry, entities: Set<Entity>, dt: number) => {
    // delete sprites for entities that no longer exist
    for (const entity of this.sprites.keys()) {
      if (entities.has(entity)) {
        continue;
      }

      for (const creator of this.sprites.get(entity)!.keys()) {
        const sprite = this.sprites.get(entity)!.get(creator)!;
        creator.delete?.(registry, entity, sprite);
      }

      this.sprites.delete(entity);
    }

    // create and update sprites for each sprite creator
    for (const entity of entities) {
      for (const creator of this.spriteCreators) {
        if (creator.query && !entity.matchesQuery(creator.query)) {
          const entitySprites = this.sprites.get(entity);
          if (!entitySprites?.has(creator)) {
            continue;
          }

          const sprite = entitySprites.get(creator)!;
          creator.delete?.(registry, entity, sprite);
          entitySprites.delete(creator);
          continue;
        }

        if (!this.sprites.has(entity)) {
          this.sprites.set(entity, new Map());
        }

        const entitySprites = this.sprites.get(entity)!;
        if (!entitySprites.has(creator) && creator.create) {
          const sprite = creator.create(registry, entity);
          entitySprites.set(creator, sprite);
        }

        const sprite = entitySprites.get(creator)!;
        creator.update?.(registry, entity, sprite, dt);
      }
    }
  };

  public dispose = () => {
    this.resizeObserver?.disconnect();
    this.app?.destroy();
  };

  public async init() {
    if (this.initialized) {
      Logger.errorAndThrow("CORE", "Renderer already initialized!");
    }

    this.initialized = false;

    this.app = new Application();
    await this.app.init({
      width: this.options.width === -1 ? this.options.parentElement.clientWidth : this.options.width,
      height: this.options.height === -1 ? this.options.parentElement.clientHeight : this.options.height,
      resizeTo: this.options.autoSize ? this.options.parentElement : undefined,
      backgroundColor: this.options.backgroundColor,
    });

    this.options.parentElement.appendChild(this.app.canvas);

    this.resizeObserver = new ResizeObserver((entries) => {
      this.app?.resize();
    });
    this.resizeObserver.observe(this.options.parentElement);

    this.initialized = true;
  }

  /**
   * Gets weather or not the renderer is initialized.
   *
   * @returns Wether or not the renderer is initialized.
   */
  public isInitialized() {
    return this.initialized;
  }

  /**
   * Waits for the renderer to be initialized.
   *
   * If the renderer is already initialized, this will resolve immediately.
   *
   * @returns A promise that resolves when the renderer is initialized.
   */
  public waitForInitialized() {
    if (this.initialized) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (this.initialized) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Registers a sprite creator.
   *
   * @param creator The sprite creator to register.
   */
  public registerSpriteCreator(creator: SpriteCreator) {
    if (this.spriteCreators.has(creator)) {
      Logger.errorAndThrow("CORE", "Cannot register sprite creator that is already registered.");
    }

    this.spriteCreators.add(creator);
  }
}
