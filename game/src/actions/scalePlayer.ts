import { ActionHandler } from "@engine/src/core/actions";
import Player from "@state/src/Player";
import { Action, createFireAction, createFireServerAction } from "./actions";
import { ActionType } from "./actionType";
import { z } from "zod";
import { Transform } from "@engine/src/core/transform";
import { Vec2 } from "@engine/src/math/vec";

export const PLAYER_SCALE_FORCE = 0.05;

export interface ScalePlayerData {
  player: Player;
  dir: number;
}

const scalePlayerActionSchema = z.object({
  dir: z.number().min(-1).max(1),
});

export type ScalePlayerServerMessageData = z.infer<typeof scalePlayerActionSchema>;

const scalePlayerActionHandler: ActionHandler<ActionType, ScalePlayerData> = (engine, action, data, dt) => {
  const { player, dir } = data;

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }

  const transform = registry.get(player.entity, Transform);
  transform.scale = Vec2.mul(transform.scale, 1 + dir * PLAYER_SCALE_FORCE);
};

export const scalePlayerAction: Action<ScalePlayerData, ScalePlayerServerMessageData> = {
  type: ActionType.SCALE_PLAYER,
  handler: scalePlayerActionHandler,
  clientToServerMessageSchema: scalePlayerActionSchema,
  serverMessageToActionData: (data, player, game) => ({
    player,
    dir: data.dir,
  }),

  fire: createFireAction(ActionType.SCALE_PLAYER),
  fireServer: createFireServerAction(ActionType.SCALE_PLAYER),
};
