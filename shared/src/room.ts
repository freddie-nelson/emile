import { ActionType } from "@game/src/actions";
import { z } from "zod";

export type RoomName = "room";

export interface RoomMetadata {
  joinable: boolean;
}

export enum RoomToClientMessage {
  PONG,
}

export enum ClientToRoomMessage {
  START_GAME,
  PING,
  GAME_ACTION,
}

export const roomOptionsSchema = z.object({
  name: z.string().min(1).max(32),
});

export type RoomJoinOptions = z.infer<typeof roomOptionsSchema>;

export const gameActionSchema = z.object({
  action: z.nativeEnum(ActionType),
  data: z.any(),
});

export type GameActionMessage = z.infer<typeof gameActionSchema>;
