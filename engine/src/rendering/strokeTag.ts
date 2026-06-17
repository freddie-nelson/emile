import { type } from "@colyseus/schema";
import { Component } from "../ecs/component";

/**
 * A component that represents a stroke tag.
 *
 * This component can be used to add a stroke to {@link TextTag} components, and others.
 */
export class StrokeTag extends Component {
  public static readonly COMPONENT_ID: number = 203;

  @type("number") color: number = 0x000000;
  @type("number") thickness: number = 10;

  constructor(color: number = 0x000000, thickness: number = 10) {
    super(StrokeTag.COMPONENT_ID);
    this.color = color;
    this.thickness = thickness;
  }
}
