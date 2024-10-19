import { Registry, RegistryType } from "@ecs/src/registry";
import { State } from "@state/src/state";
import { PhysicsWorld } from "./physics/world";
import { Vec2 } from "./math/vec";
import { Logger } from "@shared/src/Logger";

export enum EngineType {
  SERVER,
  CLIENT,
}
export function engineTypeToRegistryType(type: EngineType): RegistryType {
  switch (type) {
    case EngineType.CLIENT:
      return RegistryType.CLIENT;
    case EngineType.SERVER:
      return RegistryType.SERVER;
    default:
      throw new Error(`Unknown engine type: ${type}`);
  }
}

export type UpdateCallback = (dt: number) => void;

/**
 * The different types of update callbacks that can be registered.
 *
 * A pre update callback is called before the update loop. This will be before all the registry systems have been updated.
 *
 * A post update callback is called after the update loop. This will be after all the registry systems have been updated.
 */
export enum UpdateCallbackType {
  PRE_UPDATE,
  POST_UPDATE,
  PRE_FIXED_UPDATE,
  POST_FIXED_UPDATE,
  PRE_STATE_UPDATE,
  POST_STATE_UPDATE,
}

/**
 * The options for the engine.
 */
export interface EngineOptions {
  /**
   * The type of the engine.
   */
  type: EngineType;

  /**
   * The state to use for the engine.
   */
  state: State;

  /**
   * Wether or not to start the engine automatically.
   *
   * @default false
   */
  autoStart?: boolean;

  /**
   * The rate at which to call the fixed update loop per second.
   *
   * This is in per second, so a value of 60 would execute the fixed update loop 60 times per second.
   *
   * @default 60
   */
  fixedUpdateRate?: number;

  /**
   * The number of physics position iterations to perform each update.
   *
   * @default 6
   */
  positionIterations?: number;

  /**
   * The number of physics velocity iterations to perform each update.
   *
   * @default 4
   */
  velocityIterations?: number;

  /**
   * The gravity to apply to the physics world.
   *
   * @default { x: 0, y: 9.81 }
   */
  gravity?: Vec2;

  /**
   * The slop of colliders in the physics world.
   *
   * @default 0.05
   */
  colliderSlop?: number;
}

const defaultEngineOptions: Partial<EngineOptions> = {
  autoStart: false,
  fixedUpdateRate: 60,
  positionIterations: 6,
  velocityIterations: 4,
  gravity: new Vec2(0, 9.81),
  colliderSlop: 0.05,
};

export default class Engine {
  public readonly type: EngineType;
  public readonly registry: Registry;
  public readonly physics: PhysicsWorld;

  private readonly options: Required<EngineOptions>;
  private readonly updateCallbacks: Map<UpdateCallbackType, UpdateCallback[]> = new Map();

  private started = false;

  private updateTimeAccumulator = 0;
  private lastUpdateTime = 0;
  private lastUpdateDelta = 0;
  private timeScale = 1;

  /**
   * Creates a new engine.
   *
   * @param options The options for the engine.
   */
  constructor(options: EngineOptions) {
    this.options = { ...defaultEngineOptions, ...options } as Required<EngineOptions>;

    this.type = options.type;
    this.registry = new Registry(engineTypeToRegistryType(this.type), this.options.state.entities);

    this.physics = new PhysicsWorld({
      positionIterations: this.options.positionIterations,
      velocityIterations: this.options.velocityIterations,
      gravity: this.options.gravity,
      slop: this.options.colliderSlop,
    });
    this.registry.addSystem(this.physics);

    this.options.state.onChange(this.stateUpdate.bind(this));

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Starts the engine.
   */
  public start() {
    this.started = true;
    this.lastUpdateTime = Date.now() - this.getFixedUpdateDelta();

    this.update();
  }

  /**
   * Stops the engine.
   */
  public stop() {
    this.started = false;
  }

  /**
   * Adds an event listener for the given update type.
   *
   * @param type The type of the update callback.
   * @param callback The callback to call when the update type is triggered.
   */
  public onUpdate(type: UpdateCallbackType, callback: UpdateCallback) {
    if (!this.updateCallbacks.has(type)) {
      this.updateCallbacks.set(type, []);
    }

    this.updateCallbacks.get(type)!.push(callback);
  }

  /**
   * Removes an event listener for the given update type.
   *
   * @param type The type of the update callback.
   * @param callback The callback to remove.
   */
  public offUpdate(type: UpdateCallbackType, callback: UpdateCallback) {
    if (!this.updateCallbacks.has(type)) {
      return;
    }

    const callbacks = this.updateCallbacks.get(type)!;
    const index = callbacks.indexOf(callback);
    if (index === -1) {
      return;
    }

    callbacks.splice(index, 1);
  }

  /**
   * Gets wether or not the engine has been started.
   *
   * @returns Wether or not the engine has been started.
   */
  public isStarted() {
    return this.started;
  }

  /**
   * Gets the delta time of fixed updates.
   *
   * @returns The delta time of fixed updates.
   */
  public getFixedUpdateDelta() {
    return 1000 / this.options.fixedUpdateRate;
  }

  /**
   * Gets the last update delta.
   *
   * This is the most recent update loops delta time.
   *
   * @returns The last update delta.
   */
  public getLastUpdateDelta() {
    return this.lastUpdateDelta;
  }

  /**
   * Gets the time scale of the engine.
   *
   * @returns The time scale of the engine.
   */
  public getTimeScale() {
    return this.timeScale;
  }

  /**
   * Sets the time scale of the engine.
   *
   * The delta time will be multiplied by this value in the update loop.
   *
   * This must be greater than or equal to 0.
   *
   * @param timeScale The time scale to set.
   */
  public setTimeScale(timeScale: number) {
    if (timeScale < 0) {
      Logger.errorAndThrow("CORE", `Time scale must be greater than or equal to 0, got: ${timeScale}`);
    }

    this.timeScale = timeScale;
  }

  private update() {
    if (!this.started) {
      return;
    }

    const now = Date.now();
    const dt = (now - this.lastUpdateTime) * this.timeScale;
    this.lastUpdateDelta = dt;
    this.lastUpdateTime = now;
    this.updateTimeAccumulator += dt;

    // perform fixed updates
    const fixedDt = this.getFixedUpdateDelta() * this.timeScale;
    while (this.updateTimeAccumulator >= fixedDt) {
      this.fixedUpdate(fixedDt);
      this.updateTimeAccumulator -= fixedDt;
    }

    // pre
    this.updateCallbacks.get(UpdateCallbackType.PRE_UPDATE)?.forEach((callback) => callback(dt));

    // update
    this.registry.update(dt);

    // post
    this.updateCallbacks.get(UpdateCallbackType.POST_UPDATE)?.forEach((callback) => callback(dt));

    requestAnimationFrame(() => this.update());
  }

  private fixedUpdate(dt: number) {
    if (!this.started) {
      return;
    }

    // pre
    this.updateCallbacks.get(UpdateCallbackType.PRE_FIXED_UPDATE)?.forEach((callback) => callback(dt));

    // update
    this.registry.fixedUpdate(dt);

    // post
    this.updateCallbacks.get(UpdateCallbackType.POST_FIXED_UPDATE)?.forEach((callback) => callback(dt));
  }

  private stateUpdate() {
    if (!this.started) {
      return;
    }

    // pre
    this.updateCallbacks.get(UpdateCallbackType.PRE_STATE_UPDATE)?.forEach((callback) => callback(0));

    // update
    this.registry.stateUpdate();

    // post
    this.updateCallbacks.get(UpdateCallbackType.POST_STATE_UPDATE)?.forEach((callback) => callback(0));
  }
}