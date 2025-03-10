import { Renderer } from "@engine/src/rendering/renderer";
import Game from "@game/src/game";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { useEffect, useState } from "react";
import setupGame from "@/game/setup";

export function useGame(state: State | null, player?: Player, room?: Room<State>) {
  const [game, setGame] = useState<Game | null>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!state || !player || !room) {
      return;
    }

    setIsReady(false);

    (async () => {
      try {
        const { game, renderer } = await setupGame(state, player, room);
        setGame(game);
        setRenderer(renderer);

        setIsReady(true);
      } catch (error) {
        console.error(error);
        alert(`An error occurred while starting the game: ${String(error)}`);
      }
    })();

    return () => {
      setIsReady(false);
      setGame(null);
      setRenderer(null);

      return game?.destroy();
    };
  }, [state, player, room]);

  return [game, renderer, isReady && game !== null && renderer !== null] as const;
}
