import { MoveSystem } from "@game/src/systems/moveSystem";
import { EngineType } from "@engine/src/engine";
import { Keyboard } from "@engine/src/input/keyboard";
import { Mouse } from "@engine/src/input/mouse";
import { Renderer } from "@engine/src/rendering/renderer";
import PhysicsEntitySpriteCreator from "@engine/src/rendering/sprite-creators/physics-entity-sprite-creator";
import Game from "@game/src/game";
import { sharedEngineOptions } from "@shared/src/engine";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { useEffect, useState } from "react";
import { ColyseusClient } from "@/api/colyseus";

export function useGame(state: State | null, player?: Player, room?: Room<State>) {
  const [game, setGame] = useState<Game | null>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!state || !player) {
      return;
    }

    setIsReady(false);

    const game = new Game({
      ...sharedEngineOptions,
      type: EngineType.CLIENT,
      state: state,
      autoStart: true,
    });
    setGame(game);

    const renderer = new Renderer({
      autoInit: false,
      autoSize: true,
      backgroundColor: 0x000000,
    });
    renderer.registerSpriteCreator(new PhysicsEntitySpriteCreator(0xff0000));
    renderer.camera.zoom = 0.5;

    setRenderer(renderer);

    game.registry.addSystem(renderer);

    game.registry.addSystem(new MoveSystem(player, room, () => (room ? ColyseusClient.getPing(room.id) : 0)));

    // initalise async engine dependencies
    new Promise<void>(async (resolve) => {
      Keyboard.enable();
      Mouse.enable();

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
      setGame(null);
      setRenderer(null);

      return game?.destroy();
    };
  }, [state, player, room]);

  return [game, renderer, isReady && game !== null && renderer !== null] as const;
}
