import Watcher from "watcher";
import { spawn } from "child_process";
import kill from "tree-kill";
import { Mutex } from "async-mutex";

const watcher = new Watcher("../", {
  recursive: true,
  ignore: /node_modules|build|client|\.git/,
});

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

let p = null;
let pName = "";
let killed = false;

console.log("[DEV] Starting development server...");

const runCommand = (name, command, args) => {
  pName = name;

  return new Promise((resolve) => {
    p = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    p.once("exit", (code) => {
      console.log(`[DEV] ${name} exited with code ${code}.`);
      p = null;

      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const build = async () => {
  console.log("[DEV] Building server...");

  const res = await runCommand("build", pnpm, ["run", "build"]);
  if (killed) {
    killed = false;
    console.log("[DEV] Build was killed.");
    return;
  }

  if (!res) {
    console.log("[DEV] Failed to build server.");
    console.log("[DEV] Waiting for changes...");
    return;
  }
};

const start = async () => {
  console.log("[DEV] Starting server...");

  runCommand("start", "node", ["build/server/src/index.js", "--env-file", ".env.development"]);
};

const stop = async () => {
  if (!p) {
    return;
  }

  console.log("[DEV] Stopping server...");

  return new Promise((resolve) => {
    p.once("exit", () => {
      if (pName === "start") {
        killed = false;
      }

      p = null;
      pName = "";
      resolve();
    });

    p.stdout = null;
    p.stderr = null;
    kill(p.pid);
    killed = true;
  });
};

const mutex = new Mutex();
let activeRestartId = 0;

const restart = async (id) => {
  await mutex.acquire();

  // Not the most recent restart so cancel
  if (activeRestartId !== id) {
    mutex.release();
    return;
  }

  console.log("[DEV] Restarting server...");

  await stop();
  if (activeRestartId !== id) {
    mutex.release();
    return;
  }

  await build();
  if (activeRestartId !== id) {
    mutex.release();
    return;
  }

  await start();

  mutex.release();
};

const onEvent = () => {
  activeRestartId++;
  restart(activeRestartId);
};

["ready", "add", "change", "unlink", "unlinkDir"].forEach((event) => {
  watcher.on(event, onEvent);
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`[DEV] Received ${signal}, stopping server...`);
    await stop();

    kill(process.pid);
  });
});
