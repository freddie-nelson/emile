import { useGameStore } from "@/stores/game";
import { useEffect, useState } from "react";
import { throttle } from "throttle-debounce";

export function useRoomState(wait: number = 500) {
  const room = useGameStore((state) => state.room);
  const [state, setState] = useState(room?.state);

  useEffect(() => {
    if (!room) return;

    setState(room.state.clone());

    const cb = throttle(wait, () => setState(room.state.clone()));
    room.onStateChange(cb);

    return () => {
      room.onStateChange.remove(cb);
    };
  }, [room]);

  return state;
}
