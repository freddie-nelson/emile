import { State } from "@state/src/state";
import { Client, Room } from "colyseus";
import {
  ClientToRoomMessage,
  gameActionSchema,
  RoomJoinOptions,
  RoomMetadata,
  roomOptionsSchema,
  RoomToClientMessage,
} from "@shared/src/room";
import Player from "@state/src/Player";
import RoomIdGenerator from "@/helpers/RoomIdGenerator";
import { zodErrorToUserFriendlyMessage } from "@shared/src/zod";
import { EngineType } from "@engine/src/engine";
import { sharedEngineOptions } from "@shared/src/engine";
import { Logger } from "@shared/src/Logger";
import { Transform } from "@engine/src/core/transform";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { CircleCollider } from "@engine/src/physics/collider";
import { Vec2 } from "@engine/src/math/vec";
import { Renderable } from "@engine/src/rendering/renderable";
import Game from "@game/src/game";
import { ActionType, MovePlayerData } from "@game/src/actions";
import { ActionHandler } from "@/ActionHandler";

export class DefaultRoom extends Room<State, RoomMetadata> {
  private static LOBBY_CHANNEL = "lobby";
  private static SIMULATION_INTERVAL = 1000 / 60;
  private static PATCH_RATE = 1000 / 30;

  private game?: Game;

  maxClients = 10;

  async onCreate(options: RoomJoinOptions) {
    console.log("onCreate", options);

    this.roomId = await RoomIdGenerator.generate(this.presence, DefaultRoom.LOBBY_CHANNEL);
    this.setMetadata({ joinable: true });

    const state = new State();
    state.roomInfo.maxPlayers = this.maxClients;

    this.setState(state);
    this.setPatchRate(DefaultRoom.PATCH_RATE);

    this.game = new Game({
      ...sharedEngineOptions,
      type: EngineType.SERVER,
      state: this.state,
      manualUpdate: true,
    });

    this.setSimulationInterval(() => this.game?.update(), DefaultRoom.SIMULATION_INTERVAL);

    // setup messages
    this.onMessage(ClientToRoomMessage.START_GAME, this.handleStartGame.bind(this));

    this.onMessage(ClientToRoomMessage.PING, (client) => client.send(RoomToClientMessage.PONG));

    this.onMessage(ClientToRoomMessage.GAME_ACTION, (client, message) => {
      if (!this.getPlayer(client.sessionId) || !this.game || !this.state.roomInfo.started) {
        return;
      }

      const { success, data } = gameActionSchema.safeParse(message);
      if (!success) {
        return;
      }

      ActionHandler.handleAction(this.game, this.getPlayer(client.sessionId)!, data.action, data.data);
    });
  }

  async onAuth(client: Client, options: RoomJoinOptions) {
    console.log("onAuth", client.sessionId, options);

    const { success, error } = roomOptionsSchema.safeParse(options);
    if (!success) {
      throw new Error(zodErrorToUserFriendlyMessage(error));
    }

    if (!this.metadata?.joinable) {
      throw new Error("Room is not joinable");
    }

    return true;
  }

  onJoin(client: Client, options: RoomJoinOptions) {
    console.log("onJoin", client.sessionId, options);

    if (!this.game) {
      return Logger.errorAndThrow("DEFAULTROOM", "Game not set in onJoin");
    }

    if (this.hasReachedMaxClients()) {
      this.setMetadata({ joinable: false });
    }

    const p = new Player(client.sessionId, options.name, this.state.players.size === 0);
    this.state.players.set(client.sessionId, p);
    this.updateStartable();
  }

  onLeave(client: Client, consented: boolean) {
    console.log("onLeave", client.sessionId, consented);

    this.state.players.delete(client.sessionId);
    this.updateStartable();
  }

  async onDispose() {
    console.log("onDispose");

    await RoomIdGenerator.remove(this.presence, DefaultRoom.LOBBY_CHANNEL, this.roomId);
  }

  private handleStartGame(client: Client) {
    if (!this.game) {
      return Logger.errorAndThrow("DEFAULTROOM", "Game not set in handleStartGame");
    }

    if (this.state.roomInfo.started) {
      return;
    }

    const p = this.getPlayer(client.sessionId);
    if (!p || !p.isHost) {
      return;
    }

    this.setStarted(true);

    // create players
    for (const p of this.state.players.values()) {
      this.game?.createPlayer(p);
    }
  }

  private getPlayer(sessionId: string) {
    return this.state.players.get(sessionId);
  }

  private updateStartable() {
    if (this.state.roomInfo.started) {
      return;
    }

    this.state.roomInfo.startable = this.state.players.size >= this.state.roomInfo.playersToStart;
  }

  /**
   * Will set `roomInfo.started`, start or stop the engine and update `metadata.joinable`.
   *
   * Will not set the value if the engine is not set or the room is not startable and trying to start.
   */
  private setStarted(started: boolean) {
    if (!this.game || (!this.state.roomInfo.startable && started)) {
      return;
    }

    this.state.roomInfo.started = started;

    if (started) {
      this.game.start();
      this.setMetadata({ joinable: false });
    } else {
      this.game.stop();
      this.setMetadata({ joinable: true });
    }
  }
}
