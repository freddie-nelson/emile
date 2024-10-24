import { Schema, type } from "@colyseus/schema";

export default class Player extends Schema {
  @type("string") public sessionId: string = "";
  @type("string") public name: string = "";
  @type("boolean") public isHost: boolean = false;

  constructor(sessionId: string, name: string, isHost: boolean) {
    super();

    this.sessionId = sessionId;
    this.name = name;
    this.isHost = isHost;
  }
}
