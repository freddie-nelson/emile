import { System, SystemType, SystemUpdateData } from "../ecs/system";
import { Transform } from "../core/transform";
import { Registry } from "../ecs/registry";
import { Entity, EntityQuery } from "../ecs/entity";
import { Application, ApplicationOptions, ColorSource, ContainerChild } from "pixi.js";
import { Logger } from "@shared/src/Logger";
import { Renderable } from "./renderable";
import { Camera } from "./camera";
import Engine from "../engine";

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
   * If not set, you must manually add the renderer's canvas to the DOM. Using the `attach` method.
   *
   * @default null
   */
  parentElement?: HTMLElement | null;

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

  /**
   * Wether or not to flip the y axis.
   *
   * True will make the y axis increase upwards (sane), false will make the y axis decrease upwards (insane).
   *
   * @default true
   */
  flipYAxis?: boolean;

  /**
   * Wether or not to enable the pixi dev tools.
   *
   * @default false
   */
  enablePixiDevTools?: boolean;
}

const defaultRendererOptions: Partial<RendererOptions> = {
  autoInit: true,
  parentElement: null,
  width: -1,
  height: -1,
  autoSize: true,
  backgroundColor: "black",
  scale: 50,
  flipYAxis: true,
  enablePixiDevTools: false,
};

export interface SpriteCreatorData {
  engine: Engine;
  registry: Registry;
  renderer: Renderer;
  app: Application;
  entity: string;
  sprite: ContainerChild | null;
  dt: number;
}

export type SpriteCreatorCreate = (data: SpriteCreatorData) => ContainerChild;
export type SpriteCreatorUpdate = (data: SpriteCreatorData) => void;
export type SpriteCreatorDelete = (data: SpriteCreatorData) => void;

/**
 * A sprite creator.
 *
 * Sprite creators are used to create, update and delete sprites in the renderer.
 *
 * @warning Your create and delete methods are responsible for adding/removing the sprite from the pixi stage. The renderer will not do this for you.
 */
export interface SpriteCreator {
  /**
   * The query to match entities against.
   *
   * The create, update and delete methods will only be called for entities that match this query.
   *
   * If not set, the create, update and delete methods will be called for all entities.
   */
  readonly query?: EntityQuery;

  /**
   * Creates a sprite in the renderer.
   *
   * @param registry The registry of the renderer
   * @param app The pixi app of the renderer
   * @param entity The entity to create the sprite for
   *
   * @returns The created sprite
   */
  readonly create?: SpriteCreatorCreate;

  /**
   * Updates a sprite in the renderer.
   *
   * @param registry The registry of the renderer
   * @param app The pixi app of the renderer
   * @param entity The entity to update the sprite for
   * @param sprite The sprite to update
   * @param dt The delta time since the last engine update
   */
  readonly update?: SpriteCreatorUpdate;
  /**
   * Deletes a sprite from the renderer.
   *
   * @param registry The registry of the renderer
   * @param app The pixi app of the renderer
   * @param entity The entity to delete the sprite for
   * @param sprite The sprite to delete
   */
  readonly delete?: SpriteCreatorDelete;
}

/**
 * The renderer system.
 *
 * The renderer has a system priority of 0.
 */
export class Renderer extends System {
  private readonly options: Required<RendererOptions>;
  private readonly sprites: Map<string, Map<SpriteCreator, ContainerChild>> = new Map();
  private readonly spriteCreators: Set<SpriteCreator> = new Set();

  private initialized = false;
  private app: Application | null = null;
  private resizeObserver: ResizeObserver | null = null;

  public readonly camera: Camera = new Camera();

  /**
   * Creates a new renderer.
   *
   * @param options The options for the renderer.
   */
  constructor(options: RendererOptions) {
    super(SystemType.CLIENT, new Set([Transform, Renderable]), 0);

    this.options = { ...defaultRendererOptions, ...options } as Required<RendererOptions>;

    if (this.options.autoInit) {
      this.init();
    }
  }

  public update = ({ engine, registry, entities, dt }: SystemUpdateData) => {
    if (!this.isInitialized() || !this.app) {
      return;
    }

    this.updateSpriteCreators(engine, registry, entities, dt);
    this.updateCamera(engine, registry, dt);

    this.app.render();
  };

  public dispose = () => {
    this.waitForInitialized().then(() => {
      this.resizeObserver?.disconnect();
      this.app?.destroy({
        removeView: true,
      });
    });
  };

  public async init() {
    if (this.initialized) {
      Logger.errorAndThrow("CORE", "Renderer already initialized!");
    }

    this.initialized = false;

    this.app = new Application();

    const options: Partial<ApplicationOptions> = {
      width: this.options.width === -1 ? undefined : this.options.width,
      height: this.options.height === -1 ? undefined : this.options.height,
      backgroundColor: this.options.backgroundColor,
    };
    await this.app.init(options);

    this.initialized = true;

    if (this.options.parentElement) {
      this.attach(this.options.parentElement);
    }

    if (this.options.enablePixiDevTools) {
      (window as any).__PIXI_DEVTOOLS__ = {
        app: this.app,
      };
    }
  }

  public attach(parent: HTMLElement) {
    if (!this.isInitialized() || !this.app) {
      Logger.errorAndThrow("CORE", "Cannot attach renderer before it is initialized.");
      return;
    }

    this.options.parentElement = parent;

    if (this.options.autoSize) {
      this.app.resizeTo = parent;
    }

    this.app.renderer.resize(
      this.options.width === -1 ? parent.clientWidth : this.options.width,
      this.options.height === -1 ? parent.clientHeight : this.options.height
    );

    parent.appendChild(this.app.canvas);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      this.app?.resize();
    });
    this.resizeObserver.observe(parent);
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

  /**
   * Sets the scale of the renderer.
   *
   * @see RendererOptions["scale"]
   *
   * @param scale The scale to set.
   */
  public setScale(scale: number) {
    if (!this.isInitialized() || !this.app) {
      return Logger.errorAndThrow("CORE", "Cannot set scale before renderer is initialized.");
    }

    this.options.scale = scale;
    this.app.stage.scale.set(scale);
  }

  /**
   * Gets the scale of the renderer.
   *
   * This is the scale as set in the renderer options or through the `setScale` method.
   *
   * @see RendererOptions["scale"]
   *
   * @returns The scale of the renderer.
   */
  public getScale() {
    return this.options.scale;
  }

  private updateCamera(engine: Engine, registry: Registry, dt: number) {
    if (!this.app) {
      return;
    }

    this.camera.update(dt);

    this.app.stage.scale.set(1);
    this.app.stage.position.set(this.app.renderer.width / 2, this.app.renderer.height / 2);

    const scale = this.options.scale * this.camera.zoom;
    this.app.stage.scale.set(scale, this.options.flipYAxis ? -scale : scale);

    this.app.stage.pivot.set(this.camera.worldCentre.x, this.camera.worldCentre.y);
  }

  private updateSpriteCreators(engine: Engine, registry: Registry, entities: Set<string>, dt: number) {
    // delete sprites for entities that no longer exist
    for (const entity of this.sprites.keys()) {
      if (entities.has(entity)) {
        continue;
      }

      for (const creator of this.sprites.get(entity)!.keys()) {
        const sprite = this.sprites.get(entity)!.get(creator)!;
        creator.delete?.(this.createSpriteCreatorData(engine, registry, entity, sprite, dt));
      }

      this.sprites.delete(entity);
    }

    // create and update sprites for each sprite creator
    for (const entity of entities) {
      const e = registry.get(entity);

      for (const creator of this.spriteCreators) {
        // skip sprites that don't match the query
        // and/or delete sprites that no longer match the query
        if (creator.query && !Entity.matchesQuery(e, creator.query)) {
          const entitySprites = this.sprites.get(entity);
          if (!entitySprites?.has(creator)) {
            continue;
          }

          const sprite = entitySprites.get(creator)!;
          creator.delete?.(this.createSpriteCreatorData(engine, registry, entity, sprite, dt));
          entitySprites.delete(creator);
          continue;
        }

        if (!this.sprites.has(entity)) {
          this.sprites.set(entity, new Map());
        }

        // create sprite if it doesn't exist
        const entitySprites = this.sprites.get(entity)!;
        if (!entitySprites.has(creator) && creator.create) {
          const sprite = creator.create(this.createSpriteCreatorData(engine, registry, entity, null, dt));
          entitySprites.set(creator, sprite);
        }

        // update sprite
        const sprite = entitySprites.get(creator)!;
        creator.update?.(this.createSpriteCreatorData(engine, registry, entity, sprite, dt));
      }
    }
  }

  private createSpriteCreatorData(
    engine: Engine,
    registry: Registry,
    entity: string,
    sprite: ContainerChild | null,
    dt: number
  ): SpriteCreatorData {
    return {
      engine,
      registry,
      renderer: this,
      app: this.app!,
      entity,
      sprite,
      dt,
    };
  }
}
