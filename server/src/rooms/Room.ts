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
import Game from "@game/src/game";
import { ActionHandler } from "@/ActionHandler";
import { env } from "@/helpers/env";

export class DefaultRoom extends Room<State, RoomMetadata> {
  private game?: Game;

  maxClients = 10;

  async onCreate(options: RoomJoinOptions) {
    Logger.log("SERVER", `onCreate ${this.roomId}`);

    this.roomId = await RoomIdGenerator.generate(this.presence, env.LOBBY_CHANNEL);
    this.setMetadata({ joinable: true });

    const state = new State();
    state.roomInfo.maxPlayers = this.maxClients;

    this.setState(state);
    this.setPatchRate(env.PATCH_RATE);

    this.game = new Game({
      ...sharedEngineOptions,
      type: EngineType.SERVER,
      state: this.state,
      manualUpdate: true,
    });

    this.setSimulationInterval(() => this.game?.engine.update(), env.TICK_RATE);

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
    Logger.log("SERVER", `onAuth ${client.sessionId}`);

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
    Logger.log("SERVER", `onJoin ${client.sessionId}`);

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
    Logger.log("SERVER", "onDispose");

    await RoomIdGenerator.remove(this.presence, env.LOBBY_CHANNEL, this.roomId);
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
      Logger.log("SERVER", "Game started");

      this.game.start();
      this.setMetadata({ joinable: false });
    } else {
      Logger.log("SERVER", "Game stopped");

      this.game.stop();
      this.setMetadata({ joinable: true });
    }
  }
}
