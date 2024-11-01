import { ActionDataValidator, ActionHandler } from "@engine/src/core/actions";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import Player from "@state/src/Player";

export enum ActionType {
  MOVE_PLAYER,
}

export const PLAYER_MOVE_FORCE = 0.000004;

export interface MovePlayerData {
  player: Player;
  dir: Vec2;
}

export const movePlayerAction: ActionHandler<ActionType, MovePlayerData> = (engine, action, data, dt) => {
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

export const movePlayerActionValidator: ActionDataValidator<ActionType> = (action, data) => {
  return data.player && data.dir && typeof data.player === "object" && typeof data.dir === "object";
};
