# @emile/editor

Electron-based editor for the emile game engine.

Built with [electron-vite](https://electron-vite.org/), React, and TypeScript.

## Getting Started

```bash
pnpm install
```

### Develop

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Lint & Format

```bash
pnpm lint       # eslint --fix (sorts + removes unused imports)
pnpm format     # prettier --write .
pnpm typecheck  # tsc --noEmit
```

## Structure

```
editor/
├── electron.vite.config.ts   # electron-vite config (main / preload / renderer)
├── eslint.config.mjs         # flat ESLint config
├── .prettierrc.json          # prettier config
├── tsconfig.json             # references node + web configs
├── tsconfig.node.json        # main + preload (node env)
├── tsconfig.web.json         # renderer (browser env)
└── src/
    ├── main/index.ts         # electron main process
    ├── preload/index.ts      # context-isolated preload
    └── renderer/             # react renderer
        ├── index.html
        └── src/
```
