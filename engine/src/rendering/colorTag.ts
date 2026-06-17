import { type } from "@colyseus/schema";
import { Component } from "../ecs/component";

export class ColorTag extends Component {
  public static readonly COMPONENT_ID: number = 198;

  @type("number") color: number = 0x000000;
  @type("number") opacity: number = 1;

  constructor(color: number = 0x000000, opacity: number = 1) {
    super(ColorTag.COMPONENT_ID);
    this.color = color;
    this.opacity = opacity;
  }
}
