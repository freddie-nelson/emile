import { listen } from "@colyseus/tools";
import app from "./app.config";
import { env } from "./helpers/env";

listen(app, env.PORT);
