import { useRoomGuard } from "@/hooks/useRoomGuard";
import { useRoomState } from "@/hooks/useRoomState";
import { useGameStore } from "@/stores/game";
import { useParams } from "react-router-dom";

export function GameIndex() {
  const { id } = useParams();
  const room = useGameStore((state) => state.room)!;
  const state = useRoomState()!;

  const guard = useRoomGuard(id, room, state);
  if (guard) {
    return guard;
  }

  return (
    <main className="w-full h-screen flex flex-col justify-center items-center">
      <h1 className="text-6xl font-bold text-blue-600">Game</h1>
    </main>
  );
}
