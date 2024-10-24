import { MapSchema } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";
import { Registry, RegistryType } from "@engine/src/ecs/registry";
import { Transform } from "@engine/src/core/transform";
import { State } from "@state/src/state";
import { Client, Room } from "colyseus";
import { RoomJoinOptions, RoomMessage, RoomMetadata } from "@shared/src/room";
import Player from "@state/src/Player";
import RoomIdGenerator from "@/helpers/RoomIdGenerator";

export class DefaultRoom extends Room<State, RoomMetadata> {
  private static LOBBY_CHANNEL = "lobby";

  private registry?: Registry;

  maxClients = 10;

  async onCreate(options: RoomJoinOptions) {
    console.log("onCreate", options);

    this.roomId = await RoomIdGenerator.generate(this.presence, DefaultRoom.LOBBY_CHANNEL);
    this.setMetadata({ joinable: true });

    const state = new State();
    state.roomInfo.maxPlayers = this.maxClients;

    this.setState(state);

    this.registry = new Registry(RegistryType.SERVER, this.state.entities);
  }

  async onJoin(client: Client, options: RoomJoinOptions) {
    console.log("onJoin", client.sessionId, options);

    if (!this.metadata?.joinable) {
      client.send(RoomMessage.JOIN_FAILURE);
      client.leave();
      return;
    }

    if (this.hasReachedMaxClients()) {
      this.setMetadata({ joinable: false });
    }

    const p = new Player(client.sessionId, options.name, this.state.players.length === 0);
    this.state.players.push(p);
    this.updateStartable();

    if (!this.registry) {
      throw new Error("Registry not initialized!");
    }

    const entity = this.registry!.create(new MapSchema<Component>());
    this.registry!.add(entity, new Transform());

    client.send(RoomMessage.JOIN_SUCCESS);
  }

  async onLeave(client: Client, consented: boolean) {
    console.log("onLeave", client.sessionId, consented);
  }

  async onDispose() {
    console.log("onDispose");

    await RoomIdGenerator.remove(this.presence, DefaultRoom.LOBBY_CHANNEL, this.roomId);
  }

  private updateStartable() {
    this.state.roomInfo.startable = this.state.players.length >= this.state.roomInfo.playersToStart;
  }

  private setStarted(started: boolean) {
    this.state.roomInfo.started = started;
  }
}
