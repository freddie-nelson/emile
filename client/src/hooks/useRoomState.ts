import { useGameStore } from "@/stores/game";
import { State } from "@state/src/state";
import debounce from "debounce";
import { useEffect, useState } from "react";

export function useRoomState(wait: number = 1000) {
  const room = useGameStore((state) => state.room);
  const [state, setState] = useState(room?.state);

  useEffect(() => {
    if (!room) return;

    setState(room.state.clone());

    const cb = debounce(
      (newState: State) => {
        setState(newState.clone());
      },
      wait,
      { immediate: true }
    );
    room.onStateChange(cb);

    return () => {
      room.onStateChange.remove(cb);
    };
  }, [room]);

  return state;
}
