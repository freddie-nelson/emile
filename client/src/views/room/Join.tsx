import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { useGameStore } from "@/stores/game";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

export function RoomJoin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const joinRoomById = useGameStore((state) => state.joinRoomById);
  const isRoomJoinable = useGameStore((state) => state.isRoomJoinable);

  const [foundRoom, setFoundRoom] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsError(true);
      return;
    }

    isRoomJoinable(id).then((joinable) => {
      if (!joinable) {
        alert("Room does not exist anymore or is not joinable.");
        navigate("/");
      } else {
        setFoundRoom(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!foundRoom || !id || isError) {
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
  }, [foundRoom]);

  if (!id || isError) {
    return <Navigate to="/" />;
  }

  return <LoadingOverlay text="Joining Room" />;
}
