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
    this.registry.addSystem(new PlayerSystem(this.options.state.players));

    // only create/modify entities on the server (EXTREMELY IMPORTANT TO REMEMBER)
    if (this.options.type === EngineType.SERVER) {
      // create players
      for (const player of this.options.state.players.values()) {
        this.createPlayer(player);
      }
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
   * This calls `update` on the engine.
   *
   * @see Engine.update()
   */
  public update() {
    this._engine.update();
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

  public createPlayer(player: Player) {
    const registry = this.registry;

    const playerEntity = registry.create();
    registry.add(playerEntity, new Transform(new Vec2((Math.random() - 0.5) * 2)));
    registry.add(playerEntity, new Rigidbody());
    registry.add(playerEntity, new RectangleCollider(1.5, 1.5));
    registry.add(playerEntity, new Renderable());
    registry.add(playerEntity, new ColorTag(0xffffff));

    const rigidbody = registry.get(playerEntity, Rigidbody);
    rigidbody.frictionAir = 0.05;
    rigidbody.friction = 0.05;

    const emitterEntity = registry.create();
    registry.add(emitterEntity, new Transform());
    registry.add(emitterEntity, new Renderable());
    registry.add(emitterEntity, new ParentTag(playerEntity));

    const emitter = registry.add(emitterEntity, new ParticleEmitter());
    emitter.particleRotateSpeed = Math.PI * 2;
    emitter.particleStartColor = 0xf018af;
    emitter.particleColorStops.push(new ParticleEmitterColorStop(1, 0xffffff, 0.2));
    emitter.particleLifetimeMs = 2000;
    emitter.particleEmitRatePerSecond = 30;
    emitter.particleStartSize = 0.3;
    emitter.particleStartSizeVariance = 0.1;
    emitter.particleEndSize = 0;
    emitter.particleStartSizeInterpolationT = 0.7;

    player.entity = playerEntity;

    return playerEntity;
  }

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
