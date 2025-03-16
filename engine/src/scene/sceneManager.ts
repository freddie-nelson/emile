import { Logger } from "@shared/src/Logger";
import { System } from "../ecs/system";
import Engine from "../engine";
import World from "./world";
import { State } from "@state/src/state";
import { MapSchema } from "@colyseus/schema";
import { Entity } from "../ecs/entity";

export type SceneName = string | number;

export interface Scene {
  name: SceneName;
  data: number[];

  /**
   * Called when the scene is loaded. After the world has been added to the engine.
   *
   * Can be used to add your systems to the world, or do any other setup required for the scene.
   *
   * @param world The world created for the scene
   * @param state The state
   */
  onLoad: (world: World, state: State) => void;
}

export interface SceneEngineInterface {
  setWorld: (world: World) => void;
}

/**
 * Manages scenes for the engine.
 *
 * This class should only ever be created by the engine.
 *
 * You as a game developer will not need to instantiate this class. You should only use it's methods to manage scenes.
 *
 * You should use the `SceneManager.createScene` method to create a scene to add to the scene manager. If you have a scene serialized from a file or some other source, you should use the `SceneManager.createSceneSerialized` method.
 *
 * You can create your own {@link World} using `SceneManager.createBlankWorld` and add things to it to be used in a scene, without affecting the engine's current world.
 */
export default class SceneManager {
  /**
   * A helper function to create a scene from a world.
   *
   * This is what you should use to create a scene to add to the scene manager.
   *
   * @param name The name of the scene
   * @param world The world to create the scene from
   * @param onLoad The onLoad function for the scene
   *
   * @returns The created scene
   */
  public static createScene(name: SceneName, world: World, onLoad: Scene["onLoad"]): Scene {
    return {
      name,
      data: world.serialize(),
      onLoad,
    };
  }

  /**
   * A helper function to create a scene from serialized data.
   *
   * This should be used when you are loading a scene from a file or some other source.
   *
   * @param name The name of the scene
   * @param data The data of the scene
   * @param onLoad The onLoad function for the scene
   *
   * @returns The created scene
   */
  public static createSceneSerialized(name: SceneName, data: number[], onLoad: Scene["onLoad"]): Scene {
    return {
      name,
      data,
      onLoad,
    };
  }

  /**
   * Creates a blank world for the given engine.
   *
   * @param engine The engine to create the world for
   *
   * @returns The created world
   */
  public static createBlankWorld(engine: Engine): World {
    return new World(engine, { ...engine.opts, state: new State() });
  }

  private readonly scenes: Map<SceneName, Scene> = new Map();
  private readonly engine: Engine;
  private readonly interface: SceneEngineInterface;

  private currentScene: SceneName | null = null;

  /**
   * Manages scenes for the given engine.
   *
   * @param engine The engine to manage scenes for.
   * @param inter The interface to the engine's private properties to allow for scene/world manipulation. This will be provided from within the engine.
   */
  constructor(engine: Engine, inter: SceneEngineInterface) {
    this.engine = engine;
    this.interface = inter;
  }

  /**
   * Adds the given scene to the scene manager, if it doesn't exist, and then switches the current scene to it.
   *
   * @param scene The scene to switch to.
   */
  public switch(scene: Scene): void;

  /**
   * Switches the current scene to the scene with the given name.
   *
   * @param sceneName The name of the scene to switch to.
   */
  public switch(sceneName: SceneName): void;

  public switch(scene: Scene | SceneName): void {
    if (typeof scene === "object") {
      if (!this.has(scene.name)) {
        this.add(scene);
      }

      return this.switch(scene.name);
    }

    if (!this.scenes.has(scene)) {
      Logger.errorAndThrow("SCENEMANAGER", `No scene with name ${scene} exists.`);
      return;
    }

    this.currentScene = scene;
    const s = this.scenes.get(scene)!;

    const state = new State();
    state.decode(s.data);

    this.engine.state.entities.clear();
    for (const [id, entity] of state.entities as MapSchema<Entity>) {
      this.engine.state.entities.set(id, entity.clone());
    }
    // console.log(JSON.stringify(this.engine.state.entities.toJSON(), null, 2));

    const world = new World(this.engine, this.engine.opts);
    if (this.engine.isStarted()) {
      world.init();
    }

    this.engine.world.dispose();
    this.interface.setWorld(world);

    s.onLoad(world, state);
  }

  /**
   * Gets the current scene.
   *
   * @returns The current scene, or `null` if no scene is set.
   */
  public get current(): Scene | null {
    return this.currentScene ? this.scenes.get(this.currentScene) ?? null : null;
  }

  /**
   * Gets the name of the current scene.
   *
   * @returns The name of the current scene, or `null` if no scene is set.
   */
  public get currentName(): SceneName | null {
    return this.currentScene;
  }

  /**
   * Adds a scene to the scene manager.
   *
   * @param scene The scene to add to the scene manager.
   */
  public add(scene: Scene): void {
    if (this.scenes.has(scene.name)) {
      Logger.warn(
        "SCENEMANAGER",
        `Scene with name ${scene.name} already exists. Overwriting scene, are you sure this is what you intended?`
      );
    }

    this.scenes.set(scene.name, scene);
  }

  /**
   * Removes a scene from the scene manager.
   *
   * @param name The name of the scene to remove.
   */
  public remove(name: SceneName): void {
    this.scenes.delete(name);
  }

  /**
   * Gets a scene from the scene manager.
   *
   * @param name The name of the scene to get.
   *
   * @returns The scene with the given name, or `null` if no scene with that name exists.
   */
  public get(name: SceneName): Scene | null {
    return this.scenes.get(name) ?? null;
  }

  /**
   * Checks if the scene manager has a scene with the given name.
   *
   * @param name The name of the scene to check.
   *
   * @returns Wether or not the scene manager has a scene with the given name.
   */
  public has(name: SceneName): boolean {
    return this.scenes.has(name);
  }
}
