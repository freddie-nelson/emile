import { Schema } from "@colyseus/schema";
import { Client, Room } from "colyseus";

export class State extends Schema {}

export class DefaultRoom extends Room<State> {
  maxClients = 10;

  onCreate(options: any) {
    console.log("onCreate", options);
  }

  onJoin(client: Client, options: any) {
    console.log("onJoin", client.sessionId, options);
  }

  onLeave(client: Client, consented: boolean) {
    console.log("onLeave", client.sessionId, consented);
  }

  onDispose() {
    console.log("onDispose");
  }
}
