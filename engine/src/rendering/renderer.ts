import { System, SystemType, SystemUpdateData } from "../ecs/system";
import { Transform } from "../core/transform";
import { Registry } from "../ecs/registry";
import { Entity, EntityQuery } from "../ecs/entity";
import { Application, ApplicationOptions, ColorSource, Container, ContainerChild } from "pixi.js";
import { Logger } from "@shared/src/Logger";
import { Renderable } from "./renderable";
import { Camera, CameraOptions } from "./camera";
import Engine from "../engine";
import SceneGraph from "../scene/sceneGraph";
import { Vec2 } from "../math/vec";

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
   * Wether or not to enable the pixi dev tools.
   *
   * @default false
   */
  enablePixiDevTools?: boolean;

  /**
   * Wether or not to enable pixi interactivity on the stage.
   *
   * Uses `app.stage.eventMode = "static"` to enable interaction on the stage.
   *
   * @default true
   */
  enablePixiInteraction?: boolean;
}

const defaultRendererOptions: Partial<RendererOptions> = {
  autoInit: true,
  parentElement: null,
  width: -1,
  height: -1,
  autoSize: true,
  backgroundColor: "black",
  scale: 60,
  enablePixiDevTools: false,
  enablePixiInteraction: true,
};

export interface SpriteCreatorData {
  readonly engine: Engine;
  readonly registry: Registry;
  readonly sceneGraph: SceneGraph;
  readonly renderer: Renderer;
  readonly app: Application;
  readonly world: Container;
  readonly entity: string;
  readonly sprite: ContainerChild | null;
  readonly dt: number;
}

export enum SpriteCreatorEventType {
  /**
   * Emitted after a sprite is created.
   */
  CREATE,

  /**
   * Emitted after a sprite is updated.
   */
  UPDATE,

  /**
   * Emitted after a sprite is deleted.
   */
  DELETE,

  /**
   * Emitted after the sprite creator is disposed.
   */
  DISPOSE,
}

export type SpriteCreatorEventCallback = (
  data: SpriteCreatorData,
  creator: SpriteCreator,
  type: SpriteCreatorEventType,
) => void;

/**
 * A sprite creator.
 *
 * Sprite creators are used to create, update and delete sprites in the renderer.
 *
 * If the sprite creator update method returns a `ContainerChild`, delete will be called and the returned `ContainerChild` will replace the old one.
 *
 * @warning Your create and delete methods are responsible for adding/removing the sprite from the world container. The renderer will not do this for you.
 */
export abstract class SpriteCreator {
  /**
   * The query to match entities against.
   *
   * The create, update and delete methods will only be called for entities that match this query.
   *
   * If not set, the create, update and delete methods will be called for all entities.
   */
  readonly query?: EntityQuery;

  /**
   * If set, this will override the query for this sprite creator.
   *
   * Instead the sprite creator will run for all entities in this set.
   *
   * This can also be useful for running a 'client only' sprite creator that doesn't use entities. You can instead fill the set with as many **unique** strings as you would like sprites.
   * A good unique string would be `Math.random().toString().substring(2, 15)`, this is almost guaranteed to be unique and not collide with any of your real entities.
   *
   * DO NOT MODIFY THE SET AFTER CREATION.
   */
  readonly overrideQueryEntities?: Set<string>;

  private readonly listenerCallbacks: Map<SpriteCreatorEventType, SpriteCreatorEventCallback[]> = new Map();

  /**
   * Creates a new sprite creator.
   *
   * @param query The query to match entities against.
   * @param overrideQueryEntities The override query entities to match against.
   */
  constructor(query?: EntityQuery, overrideQueryEntities?: Set<string>) {
    this.query = query;
    this.overrideQueryEntities = overrideQueryEntities;
  }

  /**
   * Creates a sprite in the renderer.
   *
   * @param data The data for creating the sprite for the entity.
   *
   * @returns The created sprite
   */
  abstract create(data: SpriteCreatorData): ContainerChild;

  /**
   * Updates a sprite in the renderer.
   *
   * @param data The data for updating the sprite for the entity.
   *
   * @returns The new created sprite
   */
  abstract update(data: SpriteCreatorData): ContainerChild | void;
  /**
   * Deletes a sprite from the renderer.
   *
   * @param data The data for deleting the sprite for the entity.
   */
  abstract delete(data: SpriteCreatorData, replacing: boolean): void;

  /**
   * Dispose of the sprite creator.
   *
   * Can be used to clean up any resources used by the sprite creator.
   *
   * Called when the renderer is disposed.
   */
  abstract dispose(): void;

  /**
   * Adds a listener for the given event.
   *
   * @param event The event to listen for.
   * @param callback The callback to call when the event is fired.
   */
  public on(event: SpriteCreatorEventType, callback: SpriteCreatorEventCallback) {
    if (!this.listenerCallbacks.has(event)) {
      this.listenerCallbacks.set(event, []);
    }

    this.listenerCallbacks.get(event)!.push(callback);
  }

  /**
   * Removes a listener for the given event.
   *
   * If no callback is provided, all listeners for the event will be removed.
   *
   * @param event The event to stop listening for.
   * @param callback The callback to stop listening for. If not provided, all listeners for the event will be removed.
   */
  public off(event: SpriteCreatorEventType, callback?: SpriteCreatorEventCallback) {
    if (!this.listenerCallbacks.has(event)) {
      return;
    }

    if (!callback) {
      this.listenerCallbacks.delete(event);
      return;
    }

    const callbacks = this.listenerCallbacks.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emits an event to all listeners.
   *
   * @note You don't need to call this method yourself unless you want to emit custom events. The renderer will automatically emit the CREATE, UPDATE, DELETE and DISPOSE events at the appropriate times.
   *
   * @param event The event to emit.
   * @param data The data to pass to the listeners.
   */
  public emit(event: SpriteCreatorEventType, data: SpriteCreatorData) {
    if (!this.listenerCallbacks.has(event)) {
      return;
    }

    for (const callback of this.listenerCallbacks.get(event)!) {
      callback(data, this, event);
    }
  }
}

/**
 * The renderer system.
 *
 * The renderer has a system priority of 0.
 *
 * The renderer should be added to the registry after the game/engine has been started, otherwise you may encounter issues.
 */
export class Renderer extends System {
  private readonly options: Required<RendererOptions>;
  private readonly sprites: Map<string, Map<SpriteCreator, ContainerChild>> = new Map();
  private readonly spriteCreators: Set<SpriteCreator> = new Set();

  private initialized = false;
  private app: Application | null = null;
  private world: Container | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isAttached = false;

  public readonly camera: Camera = new Camera();
  public getCameraTarget?: () => Required<CameraOptions>["target"];

  /**
   * Creates a new renderer.
   *
   * @param options The options for the renderer.
   */
  constructor(options: RendererOptions) {
    super(SystemType.CLIENT, new Set([Transform, Renderable]), 0, true);

    this.options = { ...defaultRendererOptions, ...options } as Required<RendererOptions>;

    if (this.options.autoInit) {
      this.init();
    }
  }

  public update = ({ engine, registry, entities, dt }: SystemUpdateData) => {
    if (!this.isInitialized() || !this.app) {
      return;
    }

    this.updateCamera(engine, registry, dt);
    this.updateSpriteCreators(engine, registry, entities, dt);

    // this.app.render();
  };

  public dispose = () => {
    this.waitForInitialized().then(() => {
      this.resizeObserver?.disconnect();

      this.spriteCreators.forEach((creator) => {
        creator.dispose?.();
      });

      this.app?.destroy(
        {
          removeView: true,
        },
        {
          children: true,
          context: true,
          style: true,
        },
      );
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
      autoDensity: true,
      antialias: false,
      powerPreference: "high-performance",
    };
    await this.app.init(options);

    if (this.options.enablePixiDevTools) {
      (window as any).__PIXI_DEVTOOLS__ = {
        app: this.app,
      };
    }

    if (this.options.enablePixiInteraction) {
      this.app.stage.eventMode = "static";
      this.app.stage.hitArea = this.app.screen;
    }

    this.world = new Container();
    this.app.stage.addChild(this.world);

    if (this.options.parentElement) {
      this.attach(this.options.parentElement);
    }

    this.initialized = true;
  }

  public attach(parent: HTMLElement) {
    if (!this.isInitialized() || !this.app) {
      Logger.errorAndThrow("CORE", "Cannot attach renderer before it is initialized.");
      return;
    }

    this.options.parentElement = parent;

    parent.appendChild(this.app.canvas);
    this.isAttached = true;

    this.app.renderer.resize(
      this.options.width === -1 ? parent.clientWidth : this.options.width,
      this.options.height === -1 ? parent.clientHeight : this.options.height,
    );

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      this.app?.resize();
    });
    this.resizeObserver.observe(parent);

    if (this.options.autoSize) {
      this.app.resizeTo = parent;
    }
  }

  /**
   * Gets wether or not the renderer is initialized.
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

  /**
   * Gets the pixi app of the renderer.
   *
   * @returns The pixi app of the renderer.
   */
  public getApp() {
    if (!this.isInitialized()) {
      Logger.errorAndThrow("CORE", "Cannot get app before renderer is initialized.");
    }

    return this.app;
  }

  /**
   * Gets the world container of the renderer.
   *
   * @returns The world container of the renderer.
   */
  public getWorld() {
    if (!this.isInitialized()) {
      Logger.errorAndThrow("CORE", "Cannot get world before renderer is initialized.");
    }

    return this.world;
  }

  /**
   * Converts a pixel position to a world position.
   *
   * @param p The pixel position to convert. The pixel position should be relative to the top left of the screen (standard browser coordinates).
   *
   * @returns The world position of the pixel.
   */
  public convertPixelPosToWorldPos(p: Vec2): Vec2 {
    if (!this.isInitialized() || !this.app || !this.world) {
      Logger.errorAndThrow("CORE", "Cannot convert pixel to world before renderer is initialized.");
      throw new Error(); // unreachable
    }

    return new Vec2(
      (p.x - this.app.screen.width / 2) / this.app.stage.scale.x + this.world.pivot.x,
      (p.y - this.app.screen.height / 2) / this.app.stage.scale.y + this.world.pivot.y,
    );
  }

  public getSpriteFromCreator(creator: SpriteCreator, entity: string) {
    if (!this.sprites.has(entity)) {
      return null;
    }

    return this.sprites.get(entity)!.get(creator) || null;
  }

  private updateCamera(engine: Engine, registry: Registry, dt: number) {
    if (!this.app || !this.isInitialized() || !this.world || !this.camera || !this.isAttached) {
      return;
    }

    this.camera.options.target = this.getCameraTarget?.() || this.camera.options.target;
    this.camera.update(dt);

    const xScale = this.options.scale * this.camera.options.zoom;
    const yScale = -xScale; // flip y axis so y increases upwards

    if (this.app.stage.scale.x !== xScale || this.app.stage.scale.y !== yScale) {
      this.app.stage.scale.set(xScale, yScale);
    }

    this.world.position.set(
      this.app.screen.width / 2 / this.app.stage.scale.x,
      this.app.screen.height / 2 / this.app.stage.scale.y,
    );

    this.world.pivot.set(this.camera.options.worldCentre.x, this.camera.options.worldCentre.y);
  }

  private updateSpriteCreators(engine: Engine, registry: Registry, entities: Set<string>, dt: number) {
    // delete sprites for entities that no longer exist
    for (const entity of this.sprites.keys()) {
      if (entities.has(entity)) {
        continue;
      }

      for (const creator of this.sprites.get(entity)!.keys()) {
        const sprite = this.sprites.get(entity)!.get(creator)!;

        const data = this.createSpriteCreatorData(engine, registry, entity, sprite, dt);
        creator.delete?.(data, false);
        creator.emit(SpriteCreatorEventType.DELETE, data);
      }

      this.sprites.delete(entity);
    }

    const overrideSpriteCreators: SpriteCreator[] = [];

    // create and update sprites for each sprite creator
    for (const entity of entities) {
      const e = registry.get(entity);

      for (const creator of this.spriteCreators) {
        // skip sprite creators that define an override query
        if (creator.overrideQueryEntities) {
          overrideSpriteCreators.push(creator);
          continue;
        }

        // skip sprites that don't match the query
        // and/or delete sprites that no longer match the query
        if (creator.query && !Entity.matchesQuery(e, creator.query)) {
          const entitySprites = this.sprites.get(entity);
          if (!entitySprites?.has(creator)) {
            continue;
          }

          const sprite = entitySprites.get(creator)!;
          const data = this.createSpriteCreatorData(engine, registry, entity, sprite, dt);

          creator.delete?.(data, false);
          entitySprites.delete(creator);
          creator.emit(SpriteCreatorEventType.DELETE, data);
          continue;
        }

        if (!this.sprites.has(entity)) {
          this.sprites.set(entity, new Map());
        }

        // create sprite if it doesn't exist
        const entitySprites = this.sprites.get(entity)!;
        if (!entitySprites.has(creator) && creator.create) {
          const data = this.createSpriteCreatorData(engine, registry, entity, null, dt);
          const sprite = creator.create(data);
          entitySprites.set(creator, sprite);
          creator.emit(SpriteCreatorEventType.CREATE, { ...data, sprite });
        }

        // update sprite
        const sprite = entitySprites.get(creator)!;
        const data = this.createSpriteCreatorData(engine, registry, entity, sprite, dt);

        const newSprite = creator.update?.(data);
        creator.emit(SpriteCreatorEventType.UPDATE, data);

        if (newSprite) {
          creator.delete?.(data, true);
          entitySprites.set(creator, newSprite);
          creator.emit(SpriteCreatorEventType.DELETE, data);
          creator.emit(SpriteCreatorEventType.CREATE, { ...data, sprite: newSprite });
        }
      }
    }

    // handle override sprite creators
    for (const creator of overrideSpriteCreators) {
      for (const entity of creator.overrideQueryEntities!) {
        if (!this.sprites.has(entity)) {
          this.sprites.set(entity, new Map());
        }

        // create sprite if it doesn't exist
        const entitySprites = this.sprites.get(entity)!;
        if (!entitySprites.has(creator) && creator.create) {
          const data = this.createSpriteCreatorData(engine, registry, entity, null, dt);
          const sprite = creator.create(data);
          entitySprites.set(creator, sprite);
          creator.emit(SpriteCreatorEventType.CREATE, { ...data, sprite });
        }

        // update sprite
        const sprite = entitySprites.get(creator)!;
        const data = this.createSpriteCreatorData(engine, registry, entity, sprite, dt);

        const newSprite = creator.update?.(data);
        creator.emit(SpriteCreatorEventType.UPDATE, data);

        // replace the sprite if the creator returned a new one
        if (newSprite) {
          creator.delete?.(data, true);
          entitySprites.set(creator, newSprite);
          creator.emit(SpriteCreatorEventType.DELETE, data);
          creator.emit(SpriteCreatorEventType.CREATE, { ...data, sprite: newSprite });
        }
      }
    }
  }

  private createSpriteCreatorData(
    engine: Engine,
    registry: Registry,
    entity: string,
    sprite: ContainerChild | null,
    dt: number,
  ): SpriteCreatorData {
    return {
      engine,
      registry,
      sceneGraph: engine.sceneGraph,
      renderer: this,
      app: this.app!,
      world: this.world!,
      entity,
      sprite,
      dt,
    };
  }
}
