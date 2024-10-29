import { Vec2 } from "@engine/src/math/vec";
import { ActionType, MovePlayerData } from "@game/src/actions";
import Game from "@game/src/game";
import { Logger } from "@shared/src/Logger";
import Player from "@state/src/Player";
import { z } from "zod";

export const movePlayerSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
});

export class ActionHandler {
  static handleAction(game: Game, player: Player, action: ActionType, data: any) {
    switch (action) {
      case ActionType.MOVE_PLAYER:
        this.handleMovePlayer(game, player, data);
        break;

      default:
        Logger.errorAndThrow("ACTIONHANDLER", `Unsupported action type '${action}'`);
        break;
    }
  }

  static handleMovePlayer(game: Game, player: Player, d: any) {
    const { success, data } = movePlayerSchema.safeParse(d);
    if (!success) {
      return;
    }

    game.actions.enqueue(ActionType.MOVE_PLAYER, {
      player: player,
      dir: new Vec2(data.x, data.y),
    } satisfies MovePlayerData);
  }
}
