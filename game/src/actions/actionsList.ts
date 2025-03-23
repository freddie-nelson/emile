import { Action } from "./actions";
import { movePlayerAction } from "./movePlayer";
import { rotatePlayerAction } from "./rotatePlayer";
import { scalePlayerAction } from "./scalePlayer";

/**
 * The list of all actions in the game.
 *
 * ADD YOUR NEW ACTIONS HERE TO REGISTER THEM.
 */
export const actions: Action<any, any>[] = [
  movePlayerAction,
  rotatePlayerAction,
  scalePlayerAction,
  // ...
];
