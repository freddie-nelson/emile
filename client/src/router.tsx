import { createBrowserRouter } from "react-router-dom";
import { Index } from "./views/Index";
import { RoomIndex } from "./views/room/Index";
import { RoomJoin } from "./views/room/Join";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/room/:id",
    element: <RoomIndex />,
  },
  {
    path: "/room/join/:id",
    element: <RoomJoin />,
  },
]);
