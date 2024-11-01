import Watcher from "watcher";
import { spawn } from "child_process";
import kill from "tree-kill";

const watcher = new Watcher("../", {
  recursive: true,
  ignore: /node_modules|build|client|\.git/,
});

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

  const res = await runCommand("build", "pnpm.cmd", ["run", "build"]);
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

  runCommand("start", "node", ["build/server/src/index.js", "--env-file", ".env.development"]);
};

let stopPromise = null;
const stop = async () => {
  if (!p) {
    return;
  }

  console.log("[DEV] Stopping server...");

  stopPromise = new Promise((resolve) => {
    p.once("exit", () => {
      if (pName === "start") {
        killed = false;
      }

      p = null;
      pName = "";
      stopPromise = null;
      resolve();
    });

    p.stdout = null;
    p.stderr = null;
    kill(p.pid);
    killed = true;
  });

  return stopPromise;
};

let restarting = false;
let stopRestart = false;

const restart = async () => {
  if (stopRestart) {
    return;
  }

  if (restarting) {
    stopRestart = true;

    if (stopPromise) {
      await stopPromise;
    } else {
      await stop();
    }

    stopRestart = false;
  }

  console.log("[DEV] Restarting server...");

  restarting = true;
  await stop();
  if (stopRestart) {
    stopRestart = false;
    return;
  }

  await build();
  restarting = false;
};

["ready", "add", "change", "unlink", "unlinkDir"].forEach((event) => {
  watcher.on(event, () => {
    restart();
  });
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`[DEV] Received ${signal}, stopping server...`);
    await stop();

    kill(process.pid);
  });
});
