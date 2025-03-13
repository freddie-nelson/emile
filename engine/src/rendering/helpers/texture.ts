import { Graphics, Renderer, Texture, TextureSource } from "pixi.js";

export function graphicsToTexture(renderer: Renderer, graphics: Graphics): Texture<TextureSource<any>> {
  return renderer.generateTexture(graphics);
}
