import { ContainerChild } from "pixi.js";
import { Vec2 } from "../math/vec";

export class Camera {
  public readonly worldCentre: Vec2;
  public zoom: number;
  public target: ContainerChild | null = null;

  constructor(worldCentre = new Vec2(), zoom = 1) {
    this.worldCentre = worldCentre;
    this.zoom = zoom;
  }

  public update(dt: number) {
    if (this.target) {
      const targetPos = this.target.getGlobalPosition();
      this.worldCentre.x = targetPos.x;
      this.worldCentre.y = targetPos.y;
    }
  }
}
