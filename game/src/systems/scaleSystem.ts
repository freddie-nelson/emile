import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { scalePlayerAction } from "../actions/scalePlayer";

export class ScaleSystem extends System {
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
    if (Keyboard.isKeyDown("arrowup")) {
      dir += 1;
    }
    if (Keyboard.isKeyDown("arrowdown")) {
      dir -= 1;
    }

    if (dir !== 0) {
      scalePlayerAction.fire(engine, { player: this.player, dir }, this.getActionDelay?.());

      if (this.room) {
        scalePlayerAction.fireServer(this.room!, { dir });
      }
    }
  };
}
