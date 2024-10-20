import { useEffect } from "react";
import { useGameStore, useIsRoomConnected } from "./stores/game";

function App() {
  const joinOrCreateRoom = useGameStore((state) => state.joinOrCreateRoom);
  const isRoomConnected = useIsRoomConnected();

  useEffect(() => {
    joinOrCreateRoom();
  }, []);

  return (
    <main className="w-full h-screen flex justify-center items-center">
      <h1 className="text-7xl font-semibold text-blue-600">
        {!isRoomConnected ? "Connecting..." : "Connected!"}
      </h1>
    </main>
  );
}

export default App;
