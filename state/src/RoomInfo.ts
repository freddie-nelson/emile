import { Schema, type } from "@colyseus/schema";

export default class RoomInfo extends Schema {
  @type("int8") public maxPlayers: number = 10;
  @type("int8") public playersToStart: number = 1;
  @type("boolean") public startable: boolean = false;
  @type("boolean") public started: boolean = false;
}
