import { ColyseusClient } from "@/api/colyseus";
import { env } from "@/helpers/env";
import Game from "@game/src/game";
import { RoomJoinOptions } from "@shared/src/room";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { create } from "zustand";

export interface GameStore {
  colyseus: ColyseusClient;
  room: Room<State> | null;
  game: Game | null;

  createRoom: (options: RoomJoinOptions) => Promise<Room<State>>;
  joinOrCreateRoom: (options: RoomJoinOptions) => Promise<Room<State>>;
  joinRoomById: (roomId: string, options: RoomJoinOptions) => Promise<Room<State>>;
  isRoomJoinable: (id: string) => Promise<boolean>;

  leaveGame: () => Promise<void>;

  setRoom: (room: Room<State>) => void;
  setGame: (game: Game) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  colyseus: new ColyseusClient(env.GAME_SERVER_URL),
  room: null,
  game: null,

  createRoom: async (options: RoomJoinOptions) => {
    const room = await get().colyseus.create<State>("room", options);
    set({ room });

    return room;
  },
  joinOrCreateRoom: async (options: RoomJoinOptions) => {
    const room = await get().colyseus.joinOrCreate<State>("room", options);
    set({ room });

    return room;
  },
  joinRoomById: async (roomId: string, options: RoomJoinOptions) => {
    const room = await get().colyseus.joinById<State>(roomId, options);
    set({ room });

    return room;
  },
  isRoomJoinable: async (id: string) => {
    return await get().colyseus.isRoomJoinable("room", id);
  },

  leaveGame: async () => {
    const room = get().room;
    const game = get().game;

    if (game) {
      game.destroy();
    }

    if (room) {
      await room.leave();
    }

    set({ room: null, game: null });
  },

  setRoom: (room: Room<State>) => set({ room }),
  setGame: (game: Game) => set({ game }),
}));

// computed state
export const useIsRoomConnected = () => {
  const room = useGameStore((state) => state.room);
  return room !== null;
};
