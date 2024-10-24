import { RoomJoinOptions, RoomMessage, RoomMetadata, RoomName } from "@shared/src/room";
import { Client, Room, RoomAvailable } from "colyseus.js";

export class ColyseusClient {
  public readonly url: string;
  public readonly client: Client;

  constructor(url: string) {
    this.url = url;
    this.client = new Client(this.url);
  }

  public async joinOrCreate<T>(room: RoomName, options: RoomJoinOptions): Promise<Room<T>> {
    const rooms = await this.getAvailableRooms<RoomMetadata>(room);
    const availableRooms = rooms.filter((r) => r.metadata?.joinable);

    if (availableRooms.length === 0) {
      return this.create<T>(room, options);
    }

    try {
      return this.join<T>(room, false, options);
    } catch (error) {
      return this.joinOrCreate<T>(room, options);
    }
  }

  public async join<T>(room: RoomName, retryOnFail: boolean, options: RoomJoinOptions): Promise<Room<T>> {
    const r = await this.client.join<T>(room, options);

    const res = await new Promise<boolean>((resolve) => {
      r.onMessage(RoomMessage.JOIN_SUCCESS, () => resolve(true));
      r.onMessage(RoomMessage.JOIN_FAILURE, () => resolve(false));
    });
    if (!res) {
      if (!retryOnFail) {
        throw new Error("Failed to join room.");
      }

      return this.join<T>(room, true, options);
    }

    return r;
  }

  public async joinById<T>(roomId: string, options: RoomJoinOptions): Promise<Room<T>> {
    return this.client.joinById<T>(roomId, options);
  }

  public async create<T>(room: RoomName, options: RoomJoinOptions): Promise<Room<T>> {
    return this.client.create<T>(room, options);
  }

  public async getAvailableRooms<T>(room: RoomName): Promise<RoomAvailable<T>[]> {
    return this.client.getAvailableRooms<T>(room);
  }

  public async reconnect<T>(reconnectionToken: string): Promise<Room<T>> {
    return this.client.reconnect(reconnectionToken);
  }
}
