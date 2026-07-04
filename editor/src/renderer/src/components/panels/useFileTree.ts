import type { FileTreeTabId } from "@renderer/constants/layout";

export interface FileTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

const gameTree: FileTreeNode[] = [
  {
    id: "game/src",
    name: "src",
    type: "folder",
    children: [
      {
        id: "game/src/entities",
        name: "entities",
        type: "folder",
        children: [
          { id: "game/src/entities/player.ts", name: "player.ts", type: "file" },
          { id: "game/src/entities/enemy.ts", name: "enemy.ts", type: "file" },
        ],
      },
      {
        id: "game/src/systems",
        name: "systems",
        type: "folder",
        children: [
          { id: "game/src/systems/movement.ts", name: "movement.ts", type: "file" },
          { id: "game/src/systems/physics.ts", name: "physics.ts", type: "file" },
        ],
      },
      { id: "game/src/main.ts", name: "main.ts", type: "file" },
    ],
  },
  {
    id: "game/assets",
    name: "assets",
    type: "folder",
    children: [
      { id: "game/assets/sprites.png", name: "sprites.png", type: "file" },
      { id: "game/assets/scene.json", name: "scene.json", type: "file" },
    ],
  },
  { id: "game/package.json", name: "package.json", type: "file" },
  { id: "game/README.md", name: "README.md", type: "file" },
];

const clientTree: FileTreeNode[] = [
  {
    id: "client/src",
    name: "src",
    type: "folder",
    children: [
      { id: "client/src/renderer.ts", name: "renderer.ts", type: "file" },
      { id: "client/src/input.ts", name: "input.ts", type: "file" },
      { id: "client/src/ui.ts", name: "ui.ts", type: "file" },
    ],
  },
  { id: "client/package.json", name: "package.json", type: "file" },
];

const serverTree: FileTreeNode[] = [
  {
    id: "server/src",
    name: "src",
    type: "folder",
    children: [
      { id: "server/src/world.ts", name: "world.ts", type: "file" },
      { id: "server/src/lobby.ts", name: "lobby.ts", type: "file" },
      { id: "server/src/matchmaking.ts", name: "matchmaking.ts", type: "file" },
    ],
  },
  { id: "server/package.json", name: "package.json", type: "file" },
];

const sharedTree: FileTreeNode[] = [
  {
    id: "shared/src",
    name: "src",
    type: "folder",
    children: [
      { id: "shared/src/protocol.ts", name: "protocol.ts", type: "file" },
      { id: "shared/src/types.ts", name: "types.ts", type: "file" },
      { id: "shared/src/constants.ts", name: "constants.ts", type: "file" },
    ],
  },
  { id: "shared/package.json", name: "package.json", type: "file" },
];

const stateTree: FileTreeNode[] = [
  {
    id: "state",
    name: "state",
    type: "folder",
    children: [
      { id: "state/global.json", name: "global.json", type: "file" },
      { id: "state/player.json", name: "player.json", type: "file" },
      { id: "state/session.json", name: "session.json", type: "file" },
    ],
  },
];

const trees: Record<FileTreeTabId, FileTreeNode[]> = {
  game: gameTree,
  client: clientTree,
  server: serverTree,
  shared: sharedTree,
  state: stateTree,
};

/** Mock project file tree, keyed by tab. */
export function useFileTree(): Record<FileTreeTabId, FileTreeNode[]> {
  return trees;
}
