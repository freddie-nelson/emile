import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { DefaultRoom } from "./rooms/Room";
import expressBasicAuth from "express-basic-auth";
import { env } from "./helpers/env";
import { RoomName } from "@shared/src/room";

export default config({
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define("room" satisfies RoomName, DefaultRoom);

    // gameServer.simulateLatency(100);
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */

    // this is the health check route
    app.get("/hello", (req, res) => {
      res.statusCode = 200;
      res.send("Hello World!");
    });

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground);
    }

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use(
      "/colyseus",
      expressBasicAuth({
        users: { [env.MONITOR_PANEL_USERNAME]: env.MONITOR_PANEL_PASSWORD },
        challenge: true,
      }),
      monitor()
    );
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
