import { MapSchema } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";
import { Registry, RegistryType } from "@engine/src/ecs/registry";
import { Transform } from "@engine/src/core/transform";
import { State } from "@state/src/state";
import { Client, Room } from "colyseus";
import { RoomMessage, RoomMetadata } from "@shared/src/room";

export class DefaultRoom extends Room<State, RoomMetadata> {
  private registry?: Registry;

  maxClients = 10;

  onCreate(options: any) {
    console.log("onCreate", options);

    this.setMetadata({ joinable: true });

    const state = new State();
    this.setState(state);

    this.registry = new Registry(RegistryType.SERVER, this.state.entities);
  }

  onJoin(client: Client, options: any) {
    console.log("onJoin", client.sessionId, options);

    if (!this.metadata?.joinable) {
      client.send(RoomMessage.JOIN_FAILURE);
      client.leave();
      return;
    }

    if (this.hasReachedMaxClients()) {
      this.setMetadata({ joinable: false });
    }

    if (!this.registry) {
      throw new Error("Registry not initialized!");
    }

    const entity = this.registry!.create(new MapSchema<Component>());
    this.registry!.add(entity, new Transform());

    client.send(RoomMessage.JOIN_SUCCESS);
  }

  onLeave(client: Client, consented: boolean) {
    console.log("onLeave", client.sessionId, consented);
  }

  onDispose() {
    console.log("onDispose");
  }
}
