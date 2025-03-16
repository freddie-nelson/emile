import { PhysicsWorld } from "../physics/world";
import { Registry } from "../ecs/registry";
import SceneGraph from "./sceneGraph";
import Engine, { EngineOptions, engineTypeToRegistryType } from "../engine";
import SceneManager from "./sceneManager";

/**
 * The world class contains all the components that make up a game world.
 *
 * This includes:
 * - The registry which contains all the entities and components.
 * - The scene graph which manages relationships between entities.
 * - The physics world which manages the matter.js physics engine for entities.
 *
 * You can create your own {@link World} using `SceneManager.createBlankWorld` and add things to it to be used in a scene, without affecting the engine's current world. See {@link SceneManager} for more
 */
export default class World {
  public readonly registry: Registry;
  public readonly sceneGraph: SceneGraph;
  public readonly physics: PhysicsWorld;

  private readonly engine: Engine;
  private readonly options: Required<EngineOptions>;

  /**
   * Creates a new world.
   *
   * @param engine The engine that the world is associated with.
   * @param options The engine's options.
   */
  constructor(engine: Engine, options: Required<EngineOptions>) {
    this.engine = engine;
    this.options = options;

    this.registry = new Registry(engineTypeToRegistryType(engine.type), options.state.entities);

    this.sceneGraph = new SceneGraph(engine);
    this.registry.addSystem(this.sceneGraph);

    this.physics = new PhysicsWorld({
      positionIterations: options.positionIterations,
      velocityIterations: options.velocityIterations,
      gravity: options.gravity,
      slop: options.colliderSlop,
      world: this,
    });
    this.registry.addSystem(this.physics);
  }

  /**
   * Initializes the world.
   */
  public init() {
    // run pre-updates
    this.sceneGraph.update(this.registry.createSystemUpdateData(this.engine, this.sceneGraph, 1 / 60));
    this.physics.fixedUpdate(this.registry.createSystemUpdateData(this.engine, this.physics, 1 / 60));
  }

  /**
   * Disposes of the world.
   */
  public dispose() {
    this.registry.dispose(this.engine);
  }

  /**
   * Updates the world.
   *
   * @param dt The delta time since the last update.
   */
  public update(dt: number): void {
    this.registry.update(this.engine, dt);
  }

  /**
   * Fixed updates the world.
   *
   * @param dt The delta time since the last fixed update. (should be constant)
   */
  public fixedUpdate(dt: number): void {
    this.registry.fixedUpdate(this.engine, dt);
  }

  /**
   * An update which runs whenever the underlying engine state changes. (colyseus state)
   */
  public stateUpdate(): void {
    this.registry.stateUpdate(this.engine);
  }

  /**
   * Serializes the engine state. (`this.engine.state`)
   *
   * @returns The serialized world state.
   */
  public serialize(): number[] {
    return this.options.state.encodeAll();
  }
}
