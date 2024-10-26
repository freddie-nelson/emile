import { RendererCanvas } from "@/components/app/game/RendererCanvas";
import { AspectRatio } from "@/components/shared/AspectRatio";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { useEngine } from "@/hooks/useEngine";
import { useRoomGuard } from "@/hooks/useRoomGuard";
import { useRoomState } from "@/hooks/useRoomState";
import { useGameStore } from "@/stores/game";
import { useParams } from "react-router-dom";

export function GameIndex() {
  const { id } = useParams();
  const room = useGameStore((state) => state.room)!;
  const state = useRoomState()!;

  const [engine, renderer, isEngineReady] = useEngine(room);

  const guard = useRoomGuard(id, room, state);
  if (guard) {
    return guard;
  }

  return (
    <main className="w-screen h-screen flex justify-center items-center">
      {isEngineReady ? (
        <AspectRatio ratio={16 / 9} fill="min">
          <RendererCanvas engine={engine!} renderer={renderer!} />
        </AspectRatio>
      ) : (
        <LoadingOverlay text="Loading Game" />
      )}
    </main>
  );
}
