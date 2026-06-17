import { createBrowserRouter, Outlet } from "react-router-dom";
import { Index } from "./views/Index";
import { RoomIndex } from "./views/room/Index";
import { RoomJoin } from "./views/room/Join";
import { GameIndex } from "./views/game/Index";
import { NoGameRoute } from "./components/shared/NoGameRoute";
import GoogleAnalyticsTracker from "./components/shared/GoogleAnalyticsTracker";
import { Notifications } from "./components/shared/Notifications";

function RootRoute() {
  return (
    <>
      <GoogleAnalyticsTracker />
      <Outlet />
      <Notifications />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    children: [
      {
        index: true,
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
        path: "game/:id",
        element: <GameIndex />,
      },
    ],
  },
]);
