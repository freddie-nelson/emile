import Engine, { EngineOptions } from "@engine/src/engine";
import { ActionType, movePlayerAction, movePlayerActionValidator } from "./actions";
import { PlayerSystem } from "./systems/playerSystem";

export default class Game {
  private readonly options: EngineOptions;
  private _engine: Engine;

  constructor(options: EngineOptions) {
    const autoStart = options.autoStart;
    if (autoStart) {
      options.autoStart = false;
    }

    this.options = options;
    this._engine = new Engine(options);

    if (autoStart) {
      this.start();
    }
  }

  /**
   * Initialises the game and starts the engine/game.
   */
  public start() {
    // initialise game here
    this._engine.actions.register(ActionType.MOVE_PLAYER, movePlayerAction, movePlayerActionValidator);

    this.registry.addSystem(new PlayerSystem(this.options.state.players));

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

  public get engine() {
    return this._engine;
  }

  public get registry() {
    return this._engine.registry;
  }

  public get actions() {
    return this._engine.actions;
  }
}
