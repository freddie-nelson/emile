import { Presence } from "colyseus";

export default abstract class RoomIdGenerator {
  private static readonly characters = "abcdefghijklmnopqrstuvwxyz";
  private static readonly len = 4;

  private static generateRoomId(): string {
    let result = "";

    for (let i = 0; i < this.len; i++) {
      result += this.characters.charAt(Math.floor(Math.random() * this.characters.length));
    }

    return result;
  }

  public static async generate(presence: Presence, lobbyChannel: string): Promise<string> {
    const takenRoomIds = await presence.smembers(lobbyChannel);

    let roomId;
    do {
      roomId = this.generateRoomId();
    } while (takenRoomIds.includes(roomId));

    await presence.sadd(lobbyChannel, roomId);

    return roomId;
  }

  public static async remove(presence: Presence, lobbyChannel: string, roomId: string): Promise<void> {
    await presence.srem(lobbyChannel, roomId);
  }
}
