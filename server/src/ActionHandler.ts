import { ActionType } from "@game/src/actions/actionType";
import Game from "@game/src/game";
import { Logger } from "@shared/src/Logger";
import { zodErrorToUserFriendlyMessage } from "@shared/src/zod";
import Player from "@state/src/Player";

export class ActionHandler {
  static handleAction(game: Game, player: Player, type: ActionType, data: any) {
    const action = game.actionStore.get(type);
    if (!action) {
      Logger.errorAndThrow("ACTIONHANDLER", `No action found for type '${type}'`);
      return;
    }

    const schema = action.clientToServerMessageSchema;
    if (!schema) {
      Logger.errorAndThrow("ACTIONHANDLER", `No schema found for action type '${type}'`);
      return;
    }

    const { success, error, data: parsedData } = schema.safeParse(data);
    if (!success) {
      Logger.warn(
        "ACTIONHANDLER",
        `Failed to parse data for action type '${type}'. Error: ${zodErrorToUserFriendlyMessage(error)}`
      );
      Logger.warn("ACTIONHANDLER", JSON.stringify(data, null, 2));
      return;
    }

    game.actions.enqueue(type, action.serverMessageToActionData?.(parsedData, player, game) ?? parsedData);
  }
}
