import { createBrowserRouter } from "react-router-dom";
import { Index } from "./views/Index";
import { RoomIndex } from "./views/room/Index";
import { RoomJoin } from "./views/room/Join";
import { GameIndex } from "./views/game/Index";
import { NoGameRoute } from "./components/shared/NoGameRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <NoGameRoute>
        <Index />
      </NoGameRoute>
    ),
  },
  {
    path: "/room/:id",
    element: <RoomIndex />,
  },
  {
    path: "/room/:id/join",
    element: (
      <NoGameRoute>
        <RoomJoin />
      </NoGameRoute>
    ),
  },
  {
    path: "/game/:id",
    element: <GameIndex />,
  },
]);
