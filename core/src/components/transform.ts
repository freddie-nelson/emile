import { type } from "@colyseus/schema";
import { Component } from "@ecs/src/component";
import { Vec2 } from "../math/vec";

export class Transform extends Component {
  @type(Vec2) public position: Vec2;
  @type("int16") public zIndex: number;
  @type("number") public rotation: number;

  /**
   * The scale component of the transform.
   *
   * Setting the x or y scale to 0 may cause issues.
   */
  @type(Vec2) public scale: Vec2;

  constructor(
    position: Vec2 = new Vec2(),
    rotation: number = 0,
    scale: Vec2 = new Vec2(),
    zIndex: number = 0
  ) {
    super();

    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.zIndex = zIndex;
  }
}
