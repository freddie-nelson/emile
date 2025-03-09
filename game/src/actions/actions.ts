import { ActionDataValidator, ActionHandler, ActionsManager } from "@engine/src/core/actions";
import { ActionType } from "./actionType";
import { ZodSchema } from "zod";
import Engine, { EngineType } from "@engine/src/engine";
import Player from "@state/src/Player";
import Game from "../game";
import { Room } from "colyseus.js";
import { ClientToRoomMessage, GameActionMessage } from "@shared/src/room";
import { Logger } from "@shared/src/Logger";

export const createFireAction = <T>(type: ActionType) => {
  return (engine: Engine, data: T, delay?: number) => {
    if (engine.type !== EngineType.CLIENT) {
      Logger.errorAndThrow(
        "ACTION",
        `Attempt to fire action '${type}' with fireAction on server side, only use fireAction on client side.`
      );
    }

    engine.actions.enqueue(type, data, delay);
  };
};

export const createFireServerAction = <T>(type: ActionType) => {
  return (room: Room, data: T) => {
    room.send(ClientToRoomMessage.GAME_ACTION, {
      action: type,
      data,
    } satisfies GameActionMessage);
  };
};

/**
 * An action.
 *
 * @typeparam C The client side data type for the action. (type of data used in action handler)
 * @typepram S The server side data type for the action. (type of data sent from client to server)
 *
 * DO NOT REMOVE THIS INTERFACE IT IS REQUIRED BY THE ENGINE.
 */
export interface Action<C, S> {
  type: ActionType;
  handler: ActionHandler<ActionType, C>;

  /**
   * Fires the action on the client side.
   *
   * Use `createFireAction` to create a fire function for the action.
   */
  fire: (engine: Engine, data: C, delay?: number) => void;

  /**
   * Fires the action on the server side.
   *
   * Use `createFireServerAction` to create a fire function for the action.
   */
  fireServer: (room: Room, data: S) => void;

  /**
   * A schema to validate the message data sent from the client to the server for this action.
   *
   * This is required if the action is sent from the client to the server.
   */
  clientToServerMessageSchema?: ZodSchema;

  /**
   * A function to parse the server message data to the action data.
   *
   * This may be required if you need additional parsing of the data before passing it to the action handler, like converting raw objects (from network) to classes.
   *
   * @param data The data after being parsed by the clientToServerMessageSchema, data is guaranteed to be `z.infer<typeof clientToServerMessageSchema>`
   * @param player The player that sent the message
   * @param game The game instance
   *
   * @returns The data ready to be passed to the action handler
   */
  serverMessageToActionData?: (data: S, player: Player, game: Game) => C;

  /**
   * The engine type when this action should be added.
   *
   * If left undefined, the action will be added to both client and server side.
   */
  engineType?: EngineType;
}

/**
 * A store for actions.
 *
 * DO NOT REMOVE THIS CLASS IT IS REQUIRED BY THE ENGINE.
 */
export class GameActionStore {
  private readonly actions: Map<ActionType, Action<any, any>> = new Map();
  private readonly actionsManager: ActionsManager<any>;

  /**
   * Creates a new action store.
   *
   * @param actionsManager The actions manager to use for the store, most likely `engine.actions` or `game.actions`.
   */
  constructor(actionsManager: ActionsManager<any>) {
    this.actionsManager = actionsManager;
  }

  /**
   * Register an action with the store.
   *
   * This will register the action's handler and validator with the store, associated with the action's type.
   *
   * @param action The action to register
   */
  register(action: Action<any, any>) {
    this.actions.set(action.type, action);
    this.actionsManager.register(action.type, action.handler);
  }

  /**
   * Unregister an action from the store.
   *
   * @param action The action to unregister
   */
  unregister(action: Action<any, any>) {
    if (!this.actions.has(action.type)) {
      return;
    }

    this.actions.delete(action.type);
    this.actionsManager.unregister(action.type);
  }

  /**
   * Unregister the action associated with the given action type.
   *
   * @param type The type of action to unregister, or undefined to unregister all actions
   */
  clear(type?: ActionType) {
    if (type) {
      this.actions.delete(type);
      this.actionsManager.unregister(type);
    } else {
      this.actions.clear();
      this.actionsManager.clear();
    }
  }

  /**
   * Gets the action associated with the given action type.
   *
   * @param type The type of action to get
   *
   * @returns The action associated with the given type
   */
  get(type: ActionType) {
    return this.actions.get(type);
  }

  /**
   * Checks if an action is associated with the given action type.
   *
   * @param type The type of action to check for
   *
   * @returns Whether or not an action is associated with the given type
   */
  has(type: ActionType) {
    return this.actions.has(type);
  }
}
