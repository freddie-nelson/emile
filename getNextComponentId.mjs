import { readdir, readFile } from "fs/promises";
import { statSync } from "fs";

const needle = /(public)? static (readonly)? COMPONENT_ID(: number)? = ([0-9]*);/gm;
const exclude = new Set([
  "node_modules",
  ".git",
  ".vscode",
  "dist",
  "build",
  "public",
  "dist",
  "scripts",
  "getNextComponentId.mjs",
]);

const engineIdStart = 191;
const componentIds = [];

async function searchDir(dir) {
  const files = await readdir(dir);

  for (const file of files) {
    if (exclude.has(file)) continue;

    const path = `${dir}/${file}`;
    const stat = statSync(path);

    if (stat.isDirectory()) {
      //   console.log(`Searching in ${path}`);

      await searchDir(path);
    } else if (
      path.endsWith(".ts") ||
      path.endsWith(".tsx") ||
      path.endsWith(".js") ||
      path.endsWith(".jsx")
    ) {
      const content = await readFile(path, "utf8");
      const matches = content.match(needle);
      if (!matches) continue;

      for (const match of matches) {
        const id = parseInt(match.split(" ").at(-1).slice(0, -1));
        componentIds.push(id);
      }
    }
  }
}

await searchDir(".");

const engineIds = componentIds.filter((id) => id >= engineIdStart).sort((a, b) => a - b);
const userIds = componentIds.filter((id) => id < engineIdStart).sort((a, b) => a - b);

const nextEngineId = engineIds.length === 0 ? engineIdStart : Math.max(...engineIds) + 1;
const nextUserId = userIds.length === 0 ? 0 : Math.max(...userIds) + 1;

console.log(`Engine ids: ${engineIds.join(", ") || "None"}`);
console.log(`User/Game ids: ${userIds.join(", ") || "None"}`);

console.log(`Next available engine id: ${nextEngineId}`);
console.log(`Next available user/game id: ${nextUserId}`);
