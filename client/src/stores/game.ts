import { ColyseusClient } from "@/api/colyseus";
import { env } from "@/helpers/env";
import Engine from "@engine/src/engine";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { create } from "zustand";

export interface GameStore {
  colyseus: ColyseusClient;
  room: Room<State> | null;
  engine: Engine | null;

  createRoom: () => Promise<void>;
  joinOrCreateRoom: () => Promise<void>;
  joinRoomById: (roomId: string) => Promise<void>;

  setRoom: (room: Room<State>) => void;
  setEngine: (engine: Engine) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  colyseus: new ColyseusClient(env.GAME_SERVER_URL),
  room: null,
  engine: null,

  createRoom: async () => {
    const room = await get().colyseus.create<State>("room");
    set({ room });
  },
  joinOrCreateRoom: async () => {
    const room = await get().colyseus.joinOrCreate<State>("room");
    set({ room });
  },
  joinRoomById: async (roomId: string) => {
    const room = await get().colyseus.joinById<State>(roomId);
    set({ room });
  },

  setRoom: (room: Room<State>) => set({ room }),
  setEngine: (engine: Engine) => set({ engine }),
}));

// computed state
export const useIsRoomConnected = () => {
  const room = useGameStore((state) => state.room);
  return room !== null;
};
