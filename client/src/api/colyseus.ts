import { RoomJoinOptions, RoomMetadata, RoomName } from "@shared/src/room";
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
    try {
      return await this.client.join<T>(room, options);
    } catch (error) {
      if (!retryOnFail) {
        throw error;
      }

      return this.join<T>(room, true, options);
    }
  }

  public async joinById<T>(roomId: string, options: RoomJoinOptions): Promise<Room<T>> {
    const r = await this.client.joinById<T>(roomId, options);

    return r;
  }

  public async create<T>(room: RoomName, options: RoomJoinOptions): Promise<Room<T>> {
    const r = await this.client.create<T>(room, options);

    return r;
  }

  public async isRoomJoinable(room: RoomName, id: string): Promise<boolean> {
    try {
      const rooms = await this.getAvailableRooms<RoomMetadata>(room);
      const availableRooms = rooms.filter((r) => r.metadata?.joinable);

      return availableRooms.some((r) => r.roomId === id);
    } catch (error) {
      return false;
    }
  }

  public async getAvailableRooms<T>(room: RoomName): Promise<RoomAvailable<T>[]> {
    return this.client.getAvailableRooms<T>(room);
  }

  public async reconnect<T>(reconnectionToken: string): Promise<Room<T>> {
    return this.client.reconnect(reconnectionToken);
  }
}
