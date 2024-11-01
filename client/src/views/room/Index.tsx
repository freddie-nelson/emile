import { Button } from "@/components/shared/Button";
import { useRoomGuard } from "@/hooks/useRoomGuard";
import { useRoomState } from "@/hooks/useRoomState";
import { useGameStore } from "@/stores/game";
import { ClientToRoomMessage } from "@shared/src/room";
import { Navigate, useParams } from "react-router-dom";

export function RoomIndex() {
  const { id } = useParams();

  const room = useGameStore((state) => state.room)!;
  const leaveGame = useGameStore((state) => state.leaveGame);

  const state = useRoomState()!;

  const guard = useRoomGuard(id, room, state, leaveGame);
  if (guard) {
    return guard;
  }

  if (state.roomInfo.started) {
    return <Navigate to={`/game/${id}`} />;
  }

  const start = () => {
    if (!state.roomInfo.startable) return;

    room.send(ClientToRoomMessage.START_GAME);
  };

  const players = Array.from(state.players.values());
  const host = players.find((p) => p.isHost);
  const you = state.players.get(room.sessionId);
  const needToStart = Math.max(0, state.roomInfo.playersToStart - state.players.size);

  return (
    <main className="w-full h-screen flex flex-col justify-center items-center p-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-8">{host?.name}'s Room</h1>

      <div className="flex flex-col gap-4 max-w-md w-full">
        {you?.isHost && (
          <Button className="text-white bg-blue-600" onClick={start}>
            {!state.roomInfo.startable
              ? `Need ${needToStart} more players to start`
              : state.roomInfo.started
              ? "Starting..."
              : "Start Game"}
          </Button>
        )}
        <div className="flex justify-between w-full items-center font-bold text-blue-600">
          <p>Players</p>
          <p>
            {state.players.size} / {state.roomInfo.maxPlayers}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {players.map((p) => (
            <div
              key={p.sessionId}
              className="flex justify-between w-full items-center font-bold text-blue-600 bg-blue-100 p-3 rounded-md"
            >
              <p>{p.name}</p>
              <div className="flex gap-2">
                {p.isHost && <p>Host</p>}
                {p.sessionId === room.sessionId && <p>You</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
