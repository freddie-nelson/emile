import { Logger } from "@shared/src/Logger";
import { useSettingsStore } from "../stores/settings";

const TRACKS: string[] = [];

function shuffleTracks(items: string[]): string[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

class MusicPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private currentSource: AudioBufferSourceNode | null = null;
  private trackQueue: string[] = [];
  private started = false;
  private preloadPromise: Promise<void> | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private unlockHandler: (() => void) | null = null;
  private attemptingToStart = false;

  public start(): void {
    if (this.started) return;
    this.started = true;

    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.applyVolume(useSettingsStore.getState().musicVolume);
    this.unsubscribeSettings = useSettingsStore.subscribe((state) => {
      this.applyVolume(state.musicVolume);
    });

    this.preloadPromise = this.preloadTracks();

    this.installUnlockHandlers();
  }

  private applyVolume(volume: number): void {
    if (!this.gainNode) return;
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume / 100));
  }

  private async preloadTracks(): Promise<void> {
    if (!this.audioContext) return;

    await Promise.all(
      TRACKS.map(async (track) => {
        const response = await fetch(track);
        if (!response.ok) {
          throw new Error(`Failed to load music track: ${track}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.buffers.set(track, audioBuffer);
      }),
    );
  }

  private installUnlockHandlers(): void {
    if (this.unlockHandler) return;

    this.unlockHandler = () => {
      void this.tryStartPlayback();
    };

    const options = { passive: true } as const;
    document.addEventListener("pointerdown", this.unlockHandler, options);
    document.addEventListener("keydown", this.unlockHandler, options);
    document.addEventListener("touchstart", this.unlockHandler, options);
  }

  private removeUnlockHandlers(): void {
    if (!this.unlockHandler) return;

    document.removeEventListener("pointerdown", this.unlockHandler);
    document.removeEventListener("keydown", this.unlockHandler);
    document.removeEventListener("touchstart", this.unlockHandler);
    this.unlockHandler = null;
  }

  private async tryStartPlayback(): Promise<void> {
    if (!this.audioContext || !this.gainNode || this.currentSource || this.attemptingToStart) return;

    this.attemptingToStart = true;

    if (this.preloadPromise) {
      try {
        await this.preloadPromise;
      } catch {
        this.attemptingToStart = false;
        Logger.error("MusicPlayer", "Failed to preload music tracks, attempt to start playback failed.");
        return;
      }
    }

    if (this.audioContext.state !== "running") {
      try {
        await this.audioContext.resume();
      } catch {
        this.attemptingToStart = false;
        Logger.error("MusicPlayer", "Failed to resume audio context, attempt to start playback failed.");
        return;
      }
    }

    this.removeUnlockHandlers();

    if (this.trackQueue.length === 0) {
      this.trackQueue = shuffleTracks(TRACKS);
    }

    void this.playNextTrack();
    this.attemptingToStart = false;
  }

  private playNextTrack(): void {
    if (!this.audioContext || !this.gainNode) return;

    if (this.trackQueue.length === 0) {
      this.trackQueue = shuffleTracks(TRACKS);
    }

    const track = this.trackQueue.shift();
    if (!track) return;

    const buffer = this.buffers.get(track);
    if (!buffer) {
      this.trackQueue = shuffleTracks(TRACKS);
      return;
    }

    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.onended = () => {
      if (this.currentSource === source) {
        void this.playNextTrack();
      }
    };

    this.currentSource = source;
    source.start();
  }
}

let musicPlayer: MusicPlayer | null = null;

export function startMusicPlayer(): void {
  if (!musicPlayer) {
    musicPlayer = new MusicPlayer();
  }

  musicPlayer.start();
}
