import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Room } from "colyseus.js";
import { State } from "@state/src/state";

/**
 * A hook to guard against invalid rooms.
 *
 * The element should be returned in the component, if not null. (see example)
 *
 * @note If used properly it is safe to assert the room and state are not null after the guard return.
 *
 * @param id The id of the room the user is meant to be in
 * @param room The room the user is in
 * @param state The state of the room
 *
 * @returns A jsx element to render if the user's room is invalid, null otherwise
 *
 * @example
 * ```tsx
 * function Component() {
 *   ...
 *   const guard = useRoomGuard(id, room, state);
 *   if (guard) {
 *     return guard;
 *   }
 *   // After this point room and state are guaranteed to not be null/undefined
 *   ...
 * }
 * ```
 */
export function useRoomGuard(
  id: string | undefined,
  room: Room<State> | null,
  state: State | undefined,
  onLeaveRoom: () => void,
  guardOnLeave = true,
  guardOnError = true
): ReactNode | null {
  const [left, setLeft] = useState(false);

  useEffect(() => {
    if (!room) {
      return;
    }

    const cb = () => {
      alert("You have left or been disconnected from the room.");

      onLeaveRoom();
      setLeft(true);
    };

    if (guardOnLeave) {
      room.onLeave(cb);
    }

    if (guardOnError) {
      room.onError(cb);
    }

    return () => {
      room?.onLeave.remove(cb);
    };
  }, [room, onLeaveRoom, guardOnLeave, guardOnError]);

  if (left) {
    return <Navigate to="/" />;
  }

  // If no id, redirect to home
  if (!id) {
    onLeaveRoom();
    return <Navigate to="/" />;
  }

  if (!room || room.id !== id) {
    onLeaveRoom();
    return <Navigate to={`/room/${id}/join`} />;
  }

  if (!state) {
    return <LoadingOverlay text="Loading Room" />;
  }

  return null;
}
