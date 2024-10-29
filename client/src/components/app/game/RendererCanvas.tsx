import { Renderer } from "@engine/src/rendering/renderer";
import Game from "@game/src/game";
import { HTMLAttributes, memo, useEffect, useRef } from "react";

export interface RendererCanvasProps extends HTMLAttributes<HTMLDivElement> {
  game: Game;
  renderer: Renderer;
}

export const RendererCanvas = memo(({ game, renderer, ...props }: RendererCanvasProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = "";
    renderer.attach(container.current);
  });

  return <div {...props} ref={container} className={`h-full w-full ${props.className ?? ""}`}></div>;
});
