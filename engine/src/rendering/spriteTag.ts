import { type } from "@colyseus/schema";
import { Component } from "../ecs/component";

export class SpriteTag extends Component {
  public static readonly COMPONENT_ID: number = 199;

  @type("number") spriteType: number = -1;
  @type("number") overrideWidth: number = 0;
  @type("number") overrideHeight: number = 0;
  @type("number") opacity: number = 1;

  constructor(
    spriteType: number = -1,
    overrideWidth: number = 0,
    overrideHeight: number = 0,
    opacity: number = 1
  ) {
    super(SpriteTag.COMPONENT_ID);
    this.spriteType = spriteType;
    this.overrideWidth = overrideWidth;
    this.overrideHeight = overrideHeight;
    this.opacity = opacity;
  }
}
