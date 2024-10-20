import { useEffect, useRef, useState } from "react";
import { ColyseusClient } from "./api/colyseus";
import { env } from "./helpers/env";
import { Room } from "colyseus.js";
import { State } from "@state/src/state";

const colyseus = new ColyseusClient(env.GAME_SERVER_URL);

function App() {
  const room = useRef<Room<State> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    colyseus.joinOrCreate<State>("room").then((r) => {
      room.current = r;
      setIsLoading(false);
    });
  }, []);

  return (
    <main className="w-full h-screen flex justify-center items-center">
      <h1 className="text-7xl font-semibold text-blue-600">{isLoading ? "Connecting..." : "Connected!"}</h1>
    </main>
  );
}

export default App;
