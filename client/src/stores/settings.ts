import { create } from "zustand";
import { z } from "zod";

const STORAGE_KEY = "rt_settings_v1";

export interface SettingsState {
  soundVolume: number; // 0-100
  musicVolume: number; // 0-100

  setSoundVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  loadFromLocalStorage: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const settingsSchema = z.object({
    soundVolume: z.number().int().min(0).max(100),
    musicVolume: z.number().int().min(0).max(100),
  });

  function persist() {
    try {
      const s = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ soundVolume: s.soundVolume, musicVolume: s.musicVolume }),
      );
    } catch (e) {
      // ignore
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const res = settingsSchema.safeParse(parsed);
      if (!res.success) {
        // invalid data, ignore
        return;
      }

      set({ soundVolume: res.data.soundVolume, musicVolume: res.data.musicVolume });
    } catch (e) {
      // ignore
    }
  }

  return {
    soundVolume: 50,
    musicVolume: 25,

    setSoundVolume: (v: number) => {
      const value = Math.max(0, Math.min(100, Math.round(v)));
      set({ soundVolume: value });
      persist();
    },

    setMusicVolume: (v: number) => {
      const value = Math.max(0, Math.min(100, Math.round(v)));
      set({ musicVolume: value });
      persist();
    },

    loadFromLocalStorage: load,
  };
});

export function initSettingsFromStorage() {
  useSettingsStore.getState().loadFromLocalStorage();
}
