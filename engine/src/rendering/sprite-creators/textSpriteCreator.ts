import {
  ContainerChild,
  Text,
  TextStyleFontWeight,
  TextStyleOptions,
} from "pixi.js";
import { SpriteCreator, SpriteCreatorData } from "../renderer";
import { Transform } from "../../core/transform";
import { Entity } from "../../ecs/entity";
import { ColorTag } from "../colorTag";
import { lerpTransform } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";
import { TextTag } from "../text/textTag";
import { createWorldTransform } from "../../scene/sceneGraph";
import { StrokeTag } from "../strokeTag";

/**
 * The text sprite creator is used to create text sprites for entities with the TextTag component.
 *
 * This creator is used by the {@link Renderer} to render text.
 *
 * You can use this with the {@link ColorTag} component to change the color of the text.
 *
 * You can use any webfont for your text, or a font loaded like you would normally load a font in CSS.
 *
 * @see {@link TextTag}
 *
 * @note This creator is not used by the engine by default. You must add it to the renderer to use it.
 */
export default class TextSpriteCreator extends SpriteCreator {
  private readonly defaultColor: number = 0xffffff;

  /**
   * Creates a new text sprite creator.
   *
   * @param defaultColor The default color of the text. This is used if the entity does not have a {@link ColorTag} component.
   */
  constructor(defaultColor: number = 0xffffff) {
    super(new Set([Transform, TextTag]));

    this.defaultColor = defaultColor;
  }

  public create({ registry, sceneGraph, world, entity }: SpriteCreatorData): ContainerChild {
    const e = registry.get(entity);

    const textTag = Entity.getComponent(e, TextTag);
    const colorTag = Entity.getComponentOrNull(e, ColorTag);
    const strokeTag = Entity.getComponentOrNull(e, StrokeTag);
    const transform = sceneGraph.getWorldTransform(entity);

    const text = new Text({
      text: textTag.text,
      style: {
        fontFamily: textTag.font,
        fontSize: textTag.size,
        fontWeight: textTag.weight as TextStyleFontWeight,
        fill: colorTag ? colorTag.color : this.defaultColor,
        stroke: strokeTag
          ? {
              color: strokeTag.color,
              width: strokeTag.thickness,
            }
          : undefined,
      } as TextStyleOptions,
    });

    text.alpha = colorTag ? colorTag.opacity : 1;

    text.position.set(transform.position.x, transform.position.y);
    text.rotation = transform.rotation;
    text.scale.set(transform.scale.x, -transform.scale.y);
    text.zIndex = transform.zIndex;

    text.anchor.set(0.5, 0.5);

    world.addChild(text);

    return text;
  }

  public update(data: SpriteCreatorData): ContainerChild | void {
    const { registry, sceneGraph, entity, sprite } = data;

    const e = registry.get(entity);
    const text = sprite! as Text;

    const textTag = Entity.getComponent(e, TextTag);
    const colorTag = Entity.getComponentOrNull(e, ColorTag);
    const strokeTag = Entity.getComponentOrNull(e, StrokeTag);
    const transform = sceneGraph.getWorldTransform(entity);

    const newTransform = lerpTransform(
      createWorldTransform(text.position, text.rotation, text.scale, text.zIndex, true),
      transform,
      CLIENT_LERP_RATE,
    );
    text.position.set(newTransform.position.x, newTransform.position.y);
    text.scale.set(newTransform.scale.x, -newTransform.scale.y);
    text.rotation = newTransform.rotation;
    text.zIndex = transform.zIndex;

    text.text = textTag.text;
    text.style.fontFamily = textTag.font;
    text.style.fontSize = textTag.size;
    text.style.fontWeight = textTag.weight as TextStyleFontWeight;
    text.style.fill = colorTag ? colorTag.color : this.defaultColor;
    text.alpha = colorTag ? colorTag.opacity : 1;

    if (strokeTag) {
      text.style.stroke = {
        color: strokeTag.color,
        width: strokeTag.thickness,
      };
    }
  }

  public delete({ registry, app, entity, sprite }: SpriteCreatorData, replacing: boolean): void {
    sprite!.removeFromParent();
    sprite!.destroy();
  }

  public dispose(): void {
    // No resources to dispose
  }
}
