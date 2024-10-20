export type RoomName = "room";

export interface RoomMetadata {
  joinable: boolean;
}

export enum RoomMessage {
  JOIN_SUCCESS,
  JOIN_FAILURE,
}
