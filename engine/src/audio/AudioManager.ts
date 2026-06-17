import { Logger } from "@shared/src/Logger";
import { Vec2 } from "../math/vec";

export interface AudioOptions {
  offset?: number;
  volume?: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
  duration?: number;
  playbackRate?: number;
  delayMs?: number;
  position?: Vec2;
}

export interface AudioAsset extends AudioOptions {
  src: string;
}

/**
 * Audio manager is responsible for loading, managing and playing audio assets. It uses the Web Audio API to decode and play audio files.
 *
 * You must call `preloadAudio` before you can play any audio. This will load and decode all audio assets and store them in memory for quick access.
 */
export class AudioManager {
  private readonly audioAssets: Map<string, AudioAsset> = new Map();
  private readonly audioContext: AudioContext = new AudioContext();

  // maps `src` of audio asset to decoded AudioBuffer
  private audioAssetBuffers: Map<string, AudioBuffer> = new Map();
  private audioPreloaded: boolean = false;

  private activeSources: Map<
    number,
    { source: AudioBufferSourceNode; panner?: PannerNode; gain: GainNode; options: AudioOptions }
  > = new Map();

  private getCameraPosition: () => Vec2;
  private distanceForZeroVolume: number = 20;
  private globalVolume: number = 1;
  private nextId: number = 0;

  constructor(
    audioAssets: Map<string, AudioAsset>,
    getCameraPosition: () => Vec2,
    distanceForZeroVolume: number = 20,
    globalVolume: number = 1,
  ) {
    this.audioAssets = audioAssets;
    this.getCameraPosition = getCameraPosition;
    this.distanceForZeroVolume = distanceForZeroVolume;
    this.globalVolume = globalVolume;
  }

  /**
   * Updates the audio manager. This should be called every frame to update the position of the listener for spatial audio.
   *
   * @note This is automatically called by the engine, so you don't need to call this manually.
   */
  public update(): void {
    const cameraPos = this.getCameraPosition();
    this.audioContext.listener.setPosition(cameraPos.x, cameraPos.y, 0);
  }

  /**
   * Set the global volume for all audio.
   *
   * The global volume is a multiplier applied to the volume of all audio played. For example, if the global volume is set to 0.5, all audio will be played at half volume. If the global volume is set to 2, all audio will be played at double volume.
   *
   * @param volume The volume
   */
  public setGlobalVolume(volume: number): void {
    this.globalVolume = volume;

    // update volume of all currently playing audio sources
    this.activeSources.forEach((source) => {
      const v = (source.options.volume ?? 1) * this.globalVolume;
      source.gain.gain.value = v;
    });
  }

  /**
   * Get the global volume for all audio.
   *
   * @returns The global volume
   */
  public getGlobalVolume(): number {
    return this.globalVolume;
  }

  /**
   * Preloads all audio assets.
   *
   * @note This method must be called before any audio can be played.
   */
  public async preloadAudio(): Promise<void> {
    try {
      await Promise.all(
        Array.from(this.audioAssets.entries()).map(async ([key, asset]) => {
          const response = await fetch(asset.src);
          if (!response.ok || response.status !== 200) {
            Logger.errorAndThrow(
              "AudioManager",
              `Failed to load audio asset with key ${key} from src ${asset.src}`,
            );
          }

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioAssetBuffers.set(asset.src, audioBuffer);
        }),
      );
      this.audioPreloaded = true;
    } catch (error) {
      Logger.errorAndThrow("AudioManager", "Failed to preload audio assets", error);
    }
  }

  /**
   * Checks if the audio assets have been preloaded.
   *
   * @returns Wether or not the audio assets have been preloaded.
   */
  public isAudioPreloaded(): boolean {
    return this.audioPreloaded;
  }

  /**
   * Plays an audio asset by its key.
   *
   * @param key The key of the audio asset to play. This key must exist in the `audioAssets` map provided to the constructor.
   * @param delayMs The delay in milliseconds before the audio starts playing. If not provided, the audio will play immediately.
   * @param volume The volume to play the audio at.
   *
   * @returns The ID of the audio source, which can be used to pause or stop the audio later.
   */
  public play(key: string, options: Partial<AudioOptions> = {}): number {
    const asset = this.audioAssets.get(key);
    if (!asset) {
      Logger.errorAndThrow("AudioManager", `Audio asset with key ${key} not found`);
      return -1; // unreachable
    }

    const audioBuffer = this.audioAssetBuffers.get(asset.src);
    if (!audioBuffer) {
      Logger.errorAndThrow(
        "AudioManager",
        `Audio buffer for asset with key ${key} not found. Did you forget to call preloadAudio()?`,
      );
      return -1; // unreachable
    }

    options = { ...asset, ...options };

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = options.loop ?? false;
    source.loopStart = options.loopStart ?? 0;
    source.loopEnd = options.loopEnd ?? 0;
    source.playbackRate.value = options.playbackRate ?? 1;

    const v = (options.volume ?? 1) * this.globalVolume;
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = v;

    const pannerNode = this.audioContext.createPanner();
    if (options.position) {
      pannerNode.panningModel = "HRTF";
      pannerNode.distanceModel = "linear";
      pannerNode.refDistance = 1;
      pannerNode.maxDistance = this.distanceForZeroVolume;
      pannerNode.rolloffFactor = 1;
      pannerNode.setPosition(
        options.position?.x ?? this.getCameraPosition().x,
        options.position?.y ?? this.getCameraPosition().y,
        0,
      );

      source.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(this.audioContext.destination);
    } else {
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
    }

    this.audioContext.listener.setPosition(this.getCameraPosition().x, this.getCameraPosition().y, 0);

    const currentTime = this.audioContext.currentTime;
    const delay = (options.delayMs ?? 0) / 1000; // convert ms to seconds

    source.start(delay ? currentTime + delay : 0, options.offset ?? 0, options.duration ?? undefined);

    const id = this.nextId++;
    this.activeSources.set(id, { source, panner: pannerNode, gain: gainNode, options });

    source.onended = () => {
      this.activeSources.delete(id);
    };

    return id;
  }

  /**
   * Stops an audio source by its ID.
   *
   * @param id The ID of the audio source to stop.
   */
  public stop(id: number): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.source.stop();
      this.activeSources.delete(id);
    }
  }

  /**
   * Stops all currently playing audio sources.
   */
  public stopAll(): void {
    this.activeSources.forEach((source) => {
      source.source.stop();
    });
  }

  /**
   * Pauses an audio source by its ID.
   *
   * @note Only use this if you intend to resume the audio later. If you just want to stop the audio, use the `stop` method instead, which will also free up resources used by the audio source.
   *
   * @param id The ID of the audio source to pause.
   */
  public pause(id: number): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.source.stop();
    }
  }

  /**
   * Resumes an audio source by its ID.
   *
   * @param id The ID of the audio source to resume.
   */
  public resume(id: number): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.source.start();
    }
  }

  /**
   * Sets the position of an audio source by its ID. This is used for spatial audio.
   *
   * @param id The ID of the audio source to set the position of.
   * @param position The new position of the audio source.
   */
  public setPosition(id: number, position: Vec2): void {
    const source = this.activeSources.get(id);
    if (source && source.panner) {
      source.panner.setPosition(position.x, position.y, 0);
    }
  }
}
