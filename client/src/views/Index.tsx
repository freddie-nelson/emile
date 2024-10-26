import { useState } from "react";
import { useGameStore, useIsRoomConnected } from "../stores/game";
import { Button } from "@/components/shared/Button";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { useNavigate } from "react-router-dom";
import { Room } from "colyseus.js";
import { State } from "@state/src/state";

export function Index() {
  const navigate = useNavigate();

  const isRoomConnected = useIsRoomConnected();
  const createRoom = useGameStore((state) => state.createRoom);
  const joinRoomById = useGameStore((state) => state.joinRoomById);

  const [name, setName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const submit = async (cb: () => Promise<Room<State> | null>) => {
    if (isConnecting || isRoomConnected) {
      alert("You are already connected to a room.");
      return;
    }

    if (!name) {
      alert("Please enter a name.");
      return;
    }

    setIsConnecting(true);

    try {
      const r = await cb();
      if (!r) {
        setIsConnecting(false);
        alert("Failed to connect to room.");
        return;
      }

      navigate(`/room/${r.id}`);
    } catch (error) {
      console.error(error);
      alert(`Failed to connect to room. Error: ${(error as Error).message}`);
    }

    setIsConnecting(false);
  };

  return (
    <main className="w-full h-screen flex flex-col justify-center items-center p-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-8">Emile Demo</h1>

      {isConnecting && <LoadingOverlay text="Connecting" />}

      <div className="flex flex-col gap-4 max-w-md w-full">
        <div className="flex flex-col">
          <label className="text-lg font-bold text-blue-600" htmlFor="name">
            Username
          </label>
          <input
            className="border border-blue-600 rounded-md p-3 text-lg"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button
          className="bg-blue-600 text-white"
          onClick={() =>
            submit(async () =>
              createRoom({
                name,
              })
            )
          }
        >
          Create Room
        </Button>

        <Button
          className="bg-blue-600 text-white"
          onClick={() =>
            submit(async () => {
              const id = prompt("Room id: ");
              if (!id) {
                return null;
              }

              return await joinRoomById(id, {
                name,
              });
            })
          }
        >
          Join Room
        </Button>
      </div>
    </main>
  );
}
