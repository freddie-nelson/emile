import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { rotatePlayerAction } from "../actions/rotatePlayer";

export class RotateSystem extends System {
  private readonly player: Player;
  private readonly room?: Room<State>;
  private readonly getActionDelay?: () => number;

  constructor(player: Player, room?: Room<State>, getActionDelay?: () => number) {
    super(SystemType.CLIENT, new Set([]));

    this.player = player;
    this.room = room;
    this.getActionDelay = getActionDelay;
  }

  public update = ({ engine, registry }: SystemUpdateData) => {
    if (!registry.has(this.player.entity)) {
      return;
    }

    let dir = 0;
    if (Keyboard.isKeyDown("arrowright")) {
      dir -= 1;
    }
    if (Keyboard.isKeyDown("arrowleft")) {
      dir += 1;
    }

    if (dir !== 0) {
      rotatePlayerAction.fire(engine, { player: this.player, dir }, this.getActionDelay?.());

      if (this.room) {
        rotatePlayerAction.fireServer(this.room!, { dir });
      }
    }
  };
}
