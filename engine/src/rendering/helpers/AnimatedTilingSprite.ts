import {
  AnimatedSprite,
  AnimatedSpriteFrames,
  FrameObject,
  Texture,
  Ticker,
  TilingSprite,
  TilingSpriteOptions,
  UPDATE_PRIORITY,
} from "pixi.js";

export interface AnimatedTilingSpriteOptions extends TilingSpriteOptions {
  textures: AnimatedSpriteFrames;
  animationSpeed?: number;
  loop?: boolean;
  autoUpdate?: boolean;
  autoPlay?: boolean;
  updateAnchor?: boolean;
  onComplete?: () => void;
  onLoop?: () => void;
  onFrameChange?: (frame: number) => void;
}

/**
 * An animated version of {@link TilingSprite}.
 *
 * This is essentially just a combination of {@link AnimatedSprite} and {@link TilingSprite}.
 *
 * Please see the pixi.js documentation for [Animated](https://api.pixijs.io/@pixi/sprite-animated/PIXI/AnimatedSprite.html) and [Tiling](https://api.pixijs.io/@pixi/sprite-tiling/PIXI/TilingSprite.html) sprite to understand this class.
 */
export default class AnimatedTilingSprite extends TilingSprite {
  private readonly animationSpeed: number;
  private readonly loop: boolean;
  private readonly autoPlay: boolean;
  private readonly updateAnchor: boolean;
  private readonly onComplete: (() => void) | null = null;
  private readonly onLoop: (() => void) | null = null;
  private readonly onFrameChange: ((frame: number) => void) | null = null;

  private _currentTime = 0;
  private _playing = false;
  private _previousFrame: number | null = null;
  private _isConnectedToTicker = false;
  private _autoUpdate = true;
  private _durations: number[] | null = null;
  private _textures: Texture[] = [];

  constructor(options: AnimatedTilingSpriteOptions) {
    const [firstFrame] = options.textures;
    super({ ...options, texture: "texture" in firstFrame ? firstFrame.texture : firstFrame }); // not using instanceof due to issues in production builds

    this.textures = options.textures;
    this.animationSpeed = options.animationSpeed ?? 1;
    this.loop = options.loop ?? true;
    this.autoUpdate = options.autoUpdate ?? true;
    this.autoPlay = options.autoPlay ?? false;
    this.updateAnchor = options.updateAnchor ?? false;
    this.onComplete = options.onComplete ?? null;
    this.onLoop = options.onLoop ?? null;
    this.onFrameChange = options.onFrameChange ?? null;

    if (this.autoPlay) {
      this.play();
    }
  }

  public stop(): void {
    if (!this._playing) {
      return;
    }

    this._playing = false;
    if (this.autoUpdate && this._isConnectedToTicker) {
      Ticker.shared.remove(this.update, this);
      this._isConnectedToTicker = false;
    }
  }

  public play(): void {
    if (this._playing) {
      return;
    }

    this._playing = true;
    if (this.autoUpdate && !this._isConnectedToTicker) {
      Ticker.shared.add(this.update, this, UPDATE_PRIORITY.HIGH);
      this._isConnectedToTicker = true;
    }
  }

  public gotoAndStop(frameNumber: number): void {
    this.stop();
    this.currentFrame = frameNumber;
  }

  public gotoAndPlay(frameNumber: number): void {
    this.currentFrame = frameNumber;
    this.play();
  }

  public update(ticker: Ticker): void {
    // If the animation isn't playing, no update is needed.
    if (!this._playing) {
      return;
    }

    // Calculate elapsed time based on ticker's deltaTime and animation speed.
    const deltaTime = ticker.deltaTime;
    const elapsed = this.animationSpeed * deltaTime;
    const previousFrame = this.currentFrame;

    // If there are specific durations set for each frame:
    if (this._durations !== null) {
      // Calculate the lag for the current frame based on the current time.
      let lag = (this._currentTime % 1) * this._durations[this.currentFrame];

      // Adjust the lag based on elapsed time.
      lag += (elapsed / 60) * 1000;

      // If the lag is negative, adjust the current time and the lag.
      while (lag < 0) {
        this._currentTime--;
        lag += this._durations[this.currentFrame];
      }

      const sign = Math.sign(this.animationSpeed * deltaTime);

      // Floor the current time to get a whole number frame.
      this._currentTime = Math.floor(this._currentTime);

      // Adjust the current time and the lag until the lag is less than the current frame's duration.
      while (lag >= this._durations[this.currentFrame]) {
        lag -= this._durations[this.currentFrame] * sign;
        this._currentTime += sign;
      }

      // Adjust the current time based on the lag and current frame's duration.
      this._currentTime += lag / this._durations[this.currentFrame];
    } else {
      // If no specific durations set, simply adjust the current time by elapsed time.
      this._currentTime += elapsed;
    }

    // Handle scenarios when animation reaches the start or the end.
    if (this._currentTime < 0 && !this.loop) {
      // If the animation shouldn't loop and it reaches the start, go to the first frame.
      this.gotoAndStop(0);

      // If there's an onComplete callback, call it.
      if (this.onComplete) {
        this.onComplete();
      }
    } else if (this._currentTime >= this._textures.length && !this.loop) {
      // If the animation shouldn't loop and it reaches the end, go to the last frame.
      this.gotoAndStop(this._textures.length - 1);

      // If there's an onComplete callback, call it.
      if (this.onComplete) {
        this.onComplete();
      }
    } else if (previousFrame !== this.currentFrame) {
      // If the current frame is different from the last update, handle loop scenarios.
      if (this.loop && this.onLoop) {
        if (
          (this.animationSpeed > 0 && this.currentFrame < previousFrame) ||
          (this.animationSpeed < 0 && this.currentFrame > previousFrame)
        ) {
          // If the animation loops, and there's an onLoop callback, call it.
          this.onLoop();
        }
      }

      // Update the texture for the current frame.
      this._updateTexture();
    }
  }

  private _updateTexture(): void {
    const currentFrame = this.currentFrame;

    if (this._previousFrame === currentFrame) {
      return;
    }

    this._previousFrame = currentFrame;

    this.texture = this._textures[currentFrame];

    if (this.updateAnchor && this.texture.defaultAnchor) {
      this.anchor.copyFrom(this.texture.defaultAnchor);
    }

    if (this.onFrameChange) {
      this.onFrameChange(this.currentFrame);
    }
  }

  get totalFrames(): number {
    return this._textures.length;
  }

  get textures(): AnimatedSpriteFrames {
    return this._textures;
  }

  set textures(value: AnimatedSpriteFrames) {
    if (!("texture" in value[0])) {
      this._textures = value as Texture[];
      this._durations = null;
    } else {
      this._textures = [];
      this._durations = [];

      for (let i = 0; i < value.length; i++) {
        this._textures.push((value[i] as FrameObject).texture);
        this._durations.push((value[i] as FrameObject).time);
      }
    }
    this._previousFrame = null;
    this.gotoAndStop(0);
    this._updateTexture();
  }

  get currentFrame(): number {
    let currentFrame = Math.floor(this._currentTime) % this._textures.length;

    if (currentFrame < 0) {
      currentFrame += this._textures.length;
    }

    return currentFrame;
  }

  set currentFrame(value: number) {
    if (value < 0 || value > this.totalFrames - 1) {
      throw new Error(
        `[AnimatedSprite]: Invalid frame index value ${value}, ` +
          `expected to be between 0 and totalFrames ${this.totalFrames}.`,
      );
    }

    const previousFrame = this.currentFrame;

    this._currentTime = value;

    if (previousFrame !== this.currentFrame) {
      this._updateTexture();
    }
  }

  get playing(): boolean {
    return this._playing;
  }

  get autoUpdate(): boolean {
    return this._autoUpdate;
  }

  set autoUpdate(value: boolean) {
    if (value !== this._autoUpdate) {
      this._autoUpdate = value;

      if (!this._autoUpdate && this._isConnectedToTicker) {
        Ticker.shared.remove(this.update, this);
        this._isConnectedToTicker = false;
      } else if (this._autoUpdate && !this._isConnectedToTicker && this._playing) {
        Ticker.shared.add(this.update, this);
        this._isConnectedToTicker = true;
      }
    }
  }
}
