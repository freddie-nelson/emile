import { MapSchema } from "@colyseus/schema";
import { Component } from "@ecs/src/component";
import { Registry, RegistryType } from "@ecs/src/registry";
import { Transform } from "@core/src/components/transform";
import { State } from "@state/src/state";
import { Client, Room } from "colyseus";

export class DefaultRoom extends Room<State> {
  private registry?: Registry;

  maxClients = 10;

  onCreate(options: any) {
    console.log("onCreate", options);

    const state = new State();
    this.setState(state);

    this.registry = new Registry(RegistryType.SERVER, this.state.entities);
  }

  onJoin(client: Client, options: any) {
    console.log("onJoin", client.sessionId, options);

    if (!this.registry) {
      throw new Error("Registry not initialized!");
    }

    setTimeout(() => {
      const entity = this.registry!.create(new MapSchema<Component>());
      this.registry!.add(entity, new Transform());
    }, 2000);
  }

  onLeave(client: Client, consented: boolean) {
    console.log("onLeave", client.sessionId, consented);
  }

  onDispose() {
    console.log("onDispose");
  }
}
