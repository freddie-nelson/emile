import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { useGameStore } from "@/stores/game";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

export function RoomJoin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isError, setIsError] = useState(false);
  const joinRoomById = useGameStore((state) => state.joinRoomById);

  useEffect(() => {
    if (!id) {
      setIsError(true);
      return;
    }

    const name = prompt("Enter your name:");
    if (!name) {
      alert("You must enter a name to join a room.");
      setIsError(true);
      return;
    }

    joinRoomById(id, { name })
      .then(() => {
        navigate(`/room/${id}`);
      })
      .catch((error) => {
        alert(`Failed to connect to room. Error: ${(error as Error).message}`);
        setIsError(true);
      });
  }, []);

  if (!id || isError) {
    return <Navigate to="/" />;
  }

  return <LoadingOverlay text="Joining Room" />;
}
