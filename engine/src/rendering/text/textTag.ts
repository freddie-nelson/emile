import { type } from "@colyseus/schema";
import { Component } from "../../ecs/component";
import TextSpriteCreator from "../sprite-creators/textSpriteCreator";
import { ColorTag } from "../colorTag";

/**
 * A component that represents a text tag.
 *
 * This component is used by the {@link TextSpriteCreator} to render text.
 *
 * You can use this with the {@link ColorTag} component to change the color of the text.
 *
 * You can use any webfont for your text, or a font loaded like you would normally load a font in CSS.
 *
 * The size determines the resolution the font is rendered at so it is best to set this high enough to avoid pixelation, and then use a {@link Transform} component to scale it up/down.
 */
export class TextTag extends Component {
  public static readonly COMPONENT_ID: number = 202;

  @type("string") text: string = "";
  @type("string") font: string = "";
  @type("string") weight: string = "";
  @type("float64") size: number = 64;

  constructor(text: string, font: string, weight: string = "normal", size: number = 64) {
    super(TextTag.COMPONENT_ID);
    this.text = text;
    this.font = font;
    this.size = size;
    this.weight = weight;
  }
}
