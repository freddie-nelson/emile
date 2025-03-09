import { ContainerChild } from "pixi.js";
import { Vec2 } from "../math/vec";

export interface CameraOptions {
  worldCentre?: Vec2;
  zoom?: number;
  target?: ContainerChild | Vec2 | null;
  smoothing?: number;
}

const defaultCameraOptions: CameraOptions = {
  worldCentre: new Vec2(0, 0),
  zoom: 1,
  target: null,
  smoothing: 0.1,
};

export class Camera {
  public readonly options: Required<CameraOptions>;

  constructor(options: Partial<CameraOptions> = {}) {
    this.options = { ...defaultCameraOptions, ...options } as Required<CameraOptions>;
  }

  public update(dt: number) {
    if (this.options.target) {
      let targetPos =
        this.options.target instanceof Vec2
          ? this.options.target
          : new Vec2(this.options.target.x, this.options.target.y);

      this.options.worldCentre = Vec2.lerp(
        this.options.worldCentre,
        new Vec2(targetPos.x, targetPos.y),
        this.options.smoothing
      );
    }
  }

  public set zoom(zoom: number) {
    this.options.zoom = zoom;
  }

  public get zoom() {
    return this.options.zoom;
  }
}
