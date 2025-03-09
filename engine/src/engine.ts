import { Registry, RegistryType } from "./ecs/registry";
import { State } from "@state/src/state";
import { PhysicsWorld } from "./physics/world";
import { Vec2 } from "./math/vec";
import { Logger } from "@shared/src/Logger";
import { ActionsManager } from "./core/actions";
import { Keyboard } from "./input/keyboard";
import { Mouse } from "./input/mouse";

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

export const CLIENT_LERP_RATE = 0.4;

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
	 * Wether or not to automatically update the engine.
	 *
	 * If this is true, the engine will not automatically call the update loop. This is useful if you want to manually call the update loop.
	 *
	 * @default false
	 */
	manualUpdate?: boolean;

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
	manualUpdate: false,
	fixedUpdateRate: 60,
	positionIterations: 6,
	velocityIterations: 4,
	gravity: new Vec2(0, 0),
	colliderSlop: 0.05,
};

/**
 * The engine class.
 *
 * The engine is the core of the game. It manages the registry, physics world, and update loop.
 *
 * Actions are processed just before the fixed update step.
 */
export default class Engine {
	public readonly type: EngineType;
	public readonly registry: Registry;
	public readonly physics: PhysicsWorld;
	public readonly actions: ActionsManager<any> = new ActionsManager();

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
		if (this.started) {
			return;
		}

		this.started = true;
		this.lastUpdateTime = Date.now() - 1000 / this.options.fixedUpdateRate;

		if (!this.options.manualUpdate) {
			this.update();
		}
	}

	/**
	 * Stops the engine.
	 */
	public stop() {
		if (!this.started) {
			return;
		}

		this.started = false;
	}

	/**
	 * Disposes of the engine.
	 */
	public dispose() {
		this.stop();
		this.registry.dispose(this);
	}

	/**
	 * Adds an event listener for the given update type.
	 *
	 * @param type The type of the update callback.
	 * @param callback The callback to call when the update type is triggered.
	 */
	public on(type: UpdateCallbackType, callback: UpdateCallback) {
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
	public off(type: UpdateCallbackType, callback: UpdateCallback) {
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
		return 1 / this.options.fixedUpdateRate;
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

	/**
	 * Performs one tick of the update loop.
	 *
	 * If the engine is not started, this will do nothing.
	 *
	 * If manual update is false (default), this will schedule the next update loop.
	 *
	 * @warning Only use this if you know what you are doing or have manual update enabled.
	 */
	public update() {
		if (!this.started) {
			return;
		}

		const now = Date.now();
		const dt = ((now - this.lastUpdateTime) / 1000) * this.timeScale;
		this.lastUpdateDelta = dt;
		this.lastUpdateTime = now;
		this.updateTimeAccumulator += dt;

		// perform fixed updates
		const fixedDt = this.getFixedUpdateDelta() * this.timeScale;
		while (this.updateTimeAccumulator >= fixedDt) {
			this.updateTimeAccumulator -= fixedDt;
			this.fixedUpdate(fixedDt);
		}

		// pre
		this.updateCallbacks.get(UpdateCallbackType.PRE_UPDATE)?.forEach((callback) => callback(dt));

		// update
		this.registry.update(this, dt);

		// post
		this.updateCallbacks.get(UpdateCallbackType.POST_UPDATE)?.forEach((callback) => callback(dt));

		// clear key presses this update
		Keyboard.clearKeyPressesThisUpdate();

		// clear button presses this update
		Mouse.clearButtonPressesThisUpdate();

		if (!this.options.manualUpdate) {
			requestAnimationFrame(() => this.update());
		}
	}

	private fixedUpdate(dt: number) {
		if (!this.started) {
			return;
		}

		// process actions
		this.actions.flush(this, dt);

		// pre
		this.updateCallbacks.get(UpdateCallbackType.PRE_FIXED_UPDATE)?.forEach((callback) => callback(dt));

		// update
		this.registry.fixedUpdate(this, dt);

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
		this.registry.stateUpdate(this);

		// post
		this.updateCallbacks.get(UpdateCallbackType.POST_STATE_UPDATE)?.forEach((callback) => callback(0));
	}
}
