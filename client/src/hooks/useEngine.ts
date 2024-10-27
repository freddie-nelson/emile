import Engine, { EngineType } from "@engine/src/engine";
import { Renderer } from "@engine/src/rendering/renderer";
import PhysicsEntitySpriteCreator from "@engine/src/rendering/sprite-creators/physics-entity-sprite-creator";
import { sharedEngineOptions } from "@shared/src/engine";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { useEffect, useState } from "react";

export function useEngine(room: Room<State> | null) {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!room) {
      return;
    }

    setIsReady(false);

    const engine = new Engine({
      ...sharedEngineOptions,
      type: EngineType.CLIENT,
      state: room.state,
      autoStart: true,
    });
    setEngine(engine);

    const renderer = new Renderer({
      autoInit: false,
      autoSize: true,
      backgroundColor: 0x000000,
    });
    renderer.registerSpriteCreator(new PhysicsEntitySpriteCreator(0xff0000));
    renderer.camera.zoom = 0.5;

    setRenderer(renderer);

    engine.registry.addSystem(renderer);

    // initalise async engine dependencies
    new Promise<void>(async (resolve) => {
      await renderer.init();

      resolve();
    })
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        console.error(error);
        alert(`An error occurred while starting the game: ${error.message}`);
      });

    return () => {
      setIsReady(false);
      setEngine(null);
      setRenderer(null);

      return engine?.dispose();
    };
  }, [room]);

  return [engine, renderer, isReady && engine !== null && renderer !== null] as const;
}
