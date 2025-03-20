import Engine, { EngineOptions, EngineType } from "@engine/src/engine";
import { GameActionStore } from "./actions/actions";
import { PlayerSystem } from "./systems/playerSystem";
import Player from "@state/src/Player";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { RectangleCollider } from "@engine/src/physics/collider";
import { Renderable } from "@engine/src/rendering/renderable";
import { Transform } from "@engine/src/core/transform";
import { actions } from "./actions/actionsList";
import { ParticleEmitter, ParticleEmitterColorStop } from "@engine/src/rendering/particles/emitter";
import { ColorTag } from "@engine/src/rendering/colorTag";
import { ParentTag } from "@engine/src/scene/parentTag";
import World from "@engine/src/scene/world";
import { createServerMainScene } from "./scenes/main";

export default class Game {
  private readonly options: EngineOptions;
  private _engine: Engine;

  public readonly actionStore: GameActionStore;

  constructor(options: EngineOptions) {
    const autoStart = options.autoStart;
    if (autoStart) {
      options.autoStart = false;
    }

    this.options = options;
    this._engine = new Engine(options);

    this.actionStore = new GameActionStore(this._engine.actions);

    if (autoStart) {
      this.start();
    }
  }

  /**
   * Initialises the game and starts the engine/game.
   */
  public start() {
    // register actions
    this.registerActions();

    // initialise game here

    // only create/modify entities on the server (EXTREMELY IMPORTANT TO REMEMBER)
    if (this.options.type === EngineType.SERVER) {
      const scene = createServerMainScene(this, this.options.state.players);
      this.engine.scenes.switch(scene);
    }

    // start engine
    this._engine.start();
  }

  /**
   * Stops the game loop.
   */
  public stop() {
    // stop game here

    // stop engine
    this._engine.stop();
  }

  /**
   * Destroys the game and engine.
   *
   * Creates a new engine ready to be started again.
   */
  public destroy() {
    // destroy game here

    // destroy engine
    this._engine.dispose();
    this._engine.stop();
    this._engine = new Engine(this.options);
  }

  // game logic

  // ...

  // getters

  public get engine() {
    return this._engine;
  }

  public get registry() {
    return this._engine.registry;
  }

  public get actions() {
    return this._engine.actions;
  }

  public get world() {
    return this._engine.world;
  }

  // private

  /**
   * Registers all actions in the `actions` array exported from `actionsList.ts`.
   *
   * You probably don't need modify this method.
   */
  private registerActions() {
    for (const action of actions) {
      if (!action.engineType || action.engineType === this._engine.type) {
        this.actionStore.register(action);
      }
    }
  }
}
