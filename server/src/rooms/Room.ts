import { Registry, RegistryType } from "@ecs/src/registry";
import { Transform } from "@state/src/components/transform";
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

    const entity = this.registry.create();
    this.registry.add(entity, new Transform());
  }

  onLeave(client: Client, consented: boolean) {
    console.log("onLeave", client.sessionId, consented);
  }

  onDispose() {
    console.log("onDispose");
  }
}
