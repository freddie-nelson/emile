import { Client, Room } from "colyseus.js";
import { cli, Options } from "@colyseus/loadtest";
import { State } from "@state/src/state";

export async function main(options: Options) {
  const client = new Client(options.endpoint);
  const room: Room<State> = await client.joinOrCreate(options.roomName, {
    // your join options here...
  });

  console.log("joined successfully!");

  room.onMessage("message-type", (payload) => {
    // logic
  });

  room.onStateChange((state) => {
    console.log("state change:", state);
    console.log("entities:", state.entities);
  });

  room.onLeave((code) => {
    console.log("left");
  });
}

cli(main);
