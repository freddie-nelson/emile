import { Action } from "./actions";
import { movePlayerAction } from "./movePlayer";
import { rotatePlayerAction } from "./rotatePlayer";
import { scalePlayerAction } from "./scalePlayer";

// ADD YOUR ACTIONS HERE
export const actions: Action<any, any>[] = [
  movePlayerAction,
  rotatePlayerAction,
  scalePlayerAction,
  // ...
];
