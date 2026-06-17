import Engine from "../engine";
import { EntityQuery } from "./entity";
import { Registry } from "./registry";
import SceneGraph from "../scene/sceneGraph";

export enum SystemType {
  CLIENT,
  SERVER,
  SERVER_AND_CLIENT,
}

export interface SystemUpdateData {
  readonly engine: Engine;
  readonly registry: Registry;
  readonly sceneGraph: SceneGraph;
  readonly entities: Set<string>;
  readonly dt: number;
}

export abstract class System {
  /**
   * The query to match entities.
   *
   * An empty query will match all entities.
   *
   * This should not be changed after the system is created.
   */
  public readonly query: EntityQuery;

  /**
   * The key of the query.
   *
   * This is used internally by the registry.
   *
   * Do not change this value.
   */
  public readonly queryKey: string;

  /**
   * The priority of the system.
   *
   * Systems with a higher priority will run before systems with a lower priority.
   */
  public readonly priority: number;

  /**
   * The type of the system.
   *
   * This should not be changed after the system is created.
   *
   * @note This is used to determine if the system should run on the client, server, or both.
   */
  public readonly type: SystemType;

  /**
   * Whether the system should be kept on the client side (not removed) when switching scenes.
   *
   * This is useful for systems that need to persist across scene changes, such as the renderer, physics world and scene graph.
   */
  public readonly keepOnClientSceneSwitch: boolean = false;

  /**
   * Creates a new system.
   *
   * @param type The type of the system.
   * @param query The query to match entities.
   * @param priority The priority of the system.
   * @param keepOnClientSceneSwitch Whether the system should be kept on the client side when switching scenes.
   */
  constructor(type: SystemType, query: EntityQuery, priority = 0, keepOnClientSceneSwitch = false) {
    this.type = type;
    this.query = query;
    this.queryKey = Registry.getEntityQueryKey(query);
    this.priority = priority;
    this.keepOnClientSceneSwitch = keepOnClientSceneSwitch;
  }

  /**
   * The function to run on updates.
   *
   * @param data The data for the update.
   */
  public readonly update?: (data: SystemUpdateData) => void;

  /**
   * The function to run on fixed updates.
   *
   * @param data The data for the update.
   */
  public readonly fixedUpdate?: (data: SystemUpdateData) => void;

  /**
   * The function to run on state updates.
   *
   * @param data The data for the update.
   */
  public readonly stateUpdate?: (data: SystemUpdateData) => void;

  /**
   * The function to run when the system is disposed.
   *
   * @param data The data for the disposal.
   */
  public readonly dispose?: (data: SystemUpdateData) => void;

  /**
   * Runs a callback every nth call. This is useful for reducing the frequency of certain updates that don't need to run every frame, such as expensive calculations or updates that only need to happen periodically.
   *
   * @param n The nth time to execute the callback, 2 will execute the callback on every 2nd call
   * @param callback The callback to execute
   */
  protected runEveryNthCall<T extends (...args: any[]) => void>(n: number, callback: T): T {
    let callCount = 0;

    return ((...args: Parameters<T>): void => {
      callCount++;

      if (callCount >= n) {
        callCount = 0;
        callback(...args);
      }
    }) as T;
  }
}
