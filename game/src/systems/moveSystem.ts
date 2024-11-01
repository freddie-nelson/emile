import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import { Vec2 } from "@engine/src/math/vec";
import { ClientToRoomMessage, GameActionMessage } from "@shared/src/room";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { ActionType, MovePlayerData } from "../actions";

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
      engine.actions.enqueue(
        ActionType.MOVE_PLAYER,
        {
          player: this.player,
          dir,
        } satisfies MovePlayerData,
        this.getActionDelay?.()
      );

      this.room?.send(ClientToRoomMessage.GAME_ACTION, {
        action: ActionType.MOVE_PLAYER,
        data: { x: dir.x, y: dir.y },
      } satisfies GameActionMessage);
    }
  };
}
