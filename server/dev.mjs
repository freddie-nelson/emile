import Watcher from "watcher";
import { spawn } from "child_process";

const watcher = new Watcher("../", {
  recursive: true,
  ignore: /node_modules/,
});

let p = null;

console.log("Starting development server...");

const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    p = spawn(command, args, {
      stdio: "inherit",
    });

    p.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const build = async () => {
  await runCommand("pnpm.cmd", ["run", "build"]);
  await runCommand("pnpm.cmd", ["run", "start:dev"]);
};

const stop = () => {
  if (p) {
    p.kill();
  }
};

const restart = () => {
  stop();
  build();
};

watcher.on("ready", () => {
  restart();
});

watcher.on("all", () => {
  restart();
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    stop();
    process.exit();
  });
});
