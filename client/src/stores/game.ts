import { ColyseusClient } from "@/api/colyseus";
import { env } from "@/helpers/env";
import Engine from "@engine/src/engine";
import { RoomJoinOptions } from "@shared/src/room";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { create } from "zustand";

export interface GameStore {
  colyseus: ColyseusClient;
  room: Room<State> | null;
  engine: Engine | null;

  createRoom: (options: RoomJoinOptions) => Promise<Room<State>>;
  joinOrCreateRoom: (options: RoomJoinOptions) => Promise<Room<State>>;
  joinRoomById: (roomId: string, options: RoomJoinOptions) => Promise<Room<State>>;

  setRoom: (room: Room<State>) => void;
  setEngine: (engine: Engine) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  colyseus: new ColyseusClient(env.GAME_SERVER_URL),
  room: null,
  engine: null,

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

  setRoom: (room: Room<State>) => set({ room }),
  setEngine: (engine: Engine) => set({ engine }),
}));

// computed state
export const useIsRoomConnected = () => {
  const room = useGameStore((state) => state.room);
  return room !== null;
};
