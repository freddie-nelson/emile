import { ActionHandler } from "@engine/src/core/actions";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import Player from "@state/src/Player";
import { Action, createFireAction, createFireServerAction } from "./actions";
import { ActionType } from "./actionType";
import { z } from "zod";

export const PLAYER_ROTATE_FORCE = 0.05;

export interface RotatePlayerData {
  player: Player;
  dir: number;
}

const rotatePlayerActionSchema = z.object({
  dir: z.number().min(-1).max(1),
});

export type RotatePlayerServerMessageData = z.infer<typeof rotatePlayerActionSchema>;

const rotatePlayerActionHandler: ActionHandler<ActionType, RotatePlayerData> = (engine, action, data, dt) => {
  const { player, dir } = data;

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }

  const rigidbody = registry.get(player.entity, Rigidbody);
  Rigidbody.setAngularVelocity(rigidbody, dir * PLAYER_ROTATE_FORCE);
};

export const rotatePlayerAction: Action<RotatePlayerData, RotatePlayerServerMessageData> = {
  type: ActionType.ROTATE_PLAYER,
  handler: rotatePlayerActionHandler,
  clientToServerMessageSchema: rotatePlayerActionSchema,
  serverMessageToActionData: (data, player, game) => ({
    player,
    dir: data.dir,
  }),

  fire: createFireAction(ActionType.ROTATE_PLAYER),
  fireServer: createFireServerAction(ActionType.ROTATE_PLAYER),
};
