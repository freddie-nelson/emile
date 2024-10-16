import { Entity, EntityQuery } from "./entity";

export enum SystemType {
  CLIENT,
  SERVER,
  SERVER_AND_CLIENT,
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
   * Creates a new system.
   *
   * @param type The type of the system.
   * @param query The query to match entities.
   * @param priority The priority of the system.
   */
  constructor(type: SystemType, query: EntityQuery, priority = 0) {
    this.type = type;
    this.query = query;
    this.priority = priority;
  }

  /**
   * The function to run on updates.
   *
   * @param dt The delta time since the last update.
   */
  public readonly update?: (entities: Entity[], dt: number) => void;

  /**
   * The function to run on fixed updates.
   *
   * @param dt The delta time since the last fixed update.
   */
  public readonly fixedUpdate?: (entities: Entity[], dt: number) => void;

  /**
   * The function to run on state updates.
   *
   * @param dt The delta time since the last state update.
   */
  public readonly stateUpdate?: (entities: Entity[], dt: number) => void;
}
