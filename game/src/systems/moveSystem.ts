import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import { Vec2 } from "@engine/src/math/vec";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { movePlayerAction } from "../actions/movePlayer";

export class MoveSystem extends System {
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

    const dir = new Vec2();
    if (Keyboard.isKeyDown("w")) {
      dir.y += 1;
    }
    if (Keyboard.isKeyDown("s")) {
      dir.y -= 1;
    }
    if (Keyboard.isKeyDown("d")) {
      dir.x += 1;
    }
    if (Keyboard.isKeyDown("a")) {
      dir.x -= 1;
    }

    if (dir.x !== 0 || dir.y !== 0) {
      movePlayerAction.fire(engine, { player: this.player, dir }, this.getActionDelay?.());

      if (this.room) {
        movePlayerAction.fireServer(this.room!, { x: dir.x, y: dir.y });
      }
    }
  };
}
