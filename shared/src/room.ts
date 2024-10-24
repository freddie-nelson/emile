import { z } from "zod";

export type RoomName = "room";

export interface RoomMetadata {
  joinable: boolean;
}

export enum ClientToRoomMessage {
  START_GAME,
}

export const roomOptionsSchema = z.object({
  name: z.string().min(1).max(32),
});

export type RoomJoinOptions = z.infer<typeof roomOptionsSchema>;
