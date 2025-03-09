import { ActionHandler } from "@engine/src/core/actions";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import Player from "@state/src/Player";
import { Action, createFireAction, createFireServerAction } from "./actions";
import { ActionType } from "./actionType";
import { z } from "zod";

export const PLAYER_MOVE_FORCE = 0.000004;

export interface MovePlayerData {
  player: Player;
  dir: Vec2;
}

const movePlayerActionSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
});

export type MovePlayerServerMessageData = z.infer<typeof movePlayerActionSchema>;

const movePlayerActionHandler: ActionHandler<ActionType, MovePlayerData> = (engine, action, data, dt) => {
  const { player, dir } = data;
  if (!player || !dir) {
    return;
  }

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }

  const rigidbody = registry.get(player.entity, Rigidbody);
  Rigidbody.applyForce(rigidbody, Vec2.mul(Vec2.normalize(dir), PLAYER_MOVE_FORCE));
};

export const movePlayerAction: Action<MovePlayerData, MovePlayerServerMessageData> = {
  type: ActionType.MOVE_PLAYER,
  handler: movePlayerActionHandler,
  clientToServerMessageSchema: movePlayerActionSchema,
  serverMessageToActionData: (data, player, game) => ({
    player,
    dir: new Vec2(data.x, data.y),
  }),

  fire: createFireAction(ActionType.MOVE_PLAYER),
  fireServer: createFireServerAction(ActionType.MOVE_PLAYER),
};
