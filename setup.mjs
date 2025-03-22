import { spawn } from "child_process";
import { join } from "path";

const runCommand = (name, command, args, options) => {
  return new Promise((resolve) => {
    const p = spawn(command, args, {
      shell: true,
      ...options,
      stdio: undefined,
    });

    let output = "";

    if (options?.stdio === "inherit") {
      p.stdout.pipe(process.stdout);
      p.stderr.pipe(process.stderr);
    }

    p.stdout.on("data", (data) => {
      output += data;
    });

    p.once("exit", (code) => {
      console.log(`[DEV] ${name} exited with code ${code}.`);

      if (code === 0) {
        resolve({ output, success: true });
      } else {
        resolve({ output, success: false });
      }
    });
  });
};

const requiredVersion = "v20.11.1";

const checkNodeVersion = async () => {
  console.log("[DEV] Checking Node.js version...");

  const res = await runCommand("node -v", "node", ["-v"]);
  if (!res.success) {
    console.log("[DEV] Node.js is not installed.");
    return false;
  }

  if (res.output.toString().trim() !== requiredVersion) {
    console.log(`[DEV] Node.js version must be ${requiredVersion}.`);
    return false;
  }

  console.log("[DEV] Node.js is installed.");
  return true;
};

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const checkPnpm = async () => {
  console.log("[DEV] Checking pnpm...");

  const res = await runCommand("pnpm -v", pnpmCommand, ["-v"]);
  if (!res.success) {
    console.log("[DEV] pnpm is not installed.");
    return false;
  }

  console.log("[DEV] pnpm is installed.");
  return true;
};

const folders = ["client", "engine", "game", "server", "shared", "state"];

const install = async () => {
  console.log("[DEV] Installing dependencies...");

  const workingDir = process.cwd();
  console.log(`[DEV] Working directory: ${workingDir}`);

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const path = join(workingDir, folder);

    console.log(`[DEV] [${i}/${folders.length}] Installing dependencies for '${folder}'...`);

    const res = await runCommand("install", pnpmCommand, ["install", "--force"], {
      cwd: path,
      stdio: "inherit",
    });
    if (!res.success) {
      console.log(`[DEV] Failed to install dependencies for '${folder}'.`);
      console.log(`[DEV] Output:\n ${res.output}`);
      return;
    }
  }

  console.log("[DEV] Dependencies installed.");
};

if ((await checkNodeVersion()) && (await checkPnpm())) {
  return install();
}
