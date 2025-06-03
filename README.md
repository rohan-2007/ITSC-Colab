# 🗂️ Project Folder Structure Overview

## 🔍 Client Folder (`packages/client/`)

### `public/`
- Static files (not processed by Vite).
- `vite.svg`: The default Vite logo. Drop favicons, images, or public fonts here.

### `src/`
- Main front-end app code (likely using React/JSX).
- Where components, hooks, pages, and styles live.

### `index.html`
- Root HTML file Vite uses as a template.
- Vite injects the JS/TS bundle here.

### `vite.config.ts`
- Vite development/build configuration.
- Defines aliases, dev server port, plugin setup, etc.

### `tsconfig*.json`
- TypeScript configuration for the front-end.
- Controls things like JSX support, path resolution, and module handling.

### `eslint.config.mjs`
- Linting rules for consistent code style.
- `.mjs` extension because the config uses ES Modules.

---

## 🧠 Server Folder (`packages/server/`)

### `src/`
- Contains the TypeScript source code for the server.
- `index.ts`: Likely the Express app's entry point.

### `dist/`
- Compiled output from TypeScript (`tsc`).
- `index.js`: The compiled server file.
- `*.map`, `.tsbuildinfo`: Used for debugging and incremental build optimization.
- *Note:* Don’t manually touch this folder — it’s auto-generated.

---

## 🧾 Top-Level Files

### `.gitignore`
- Tells Git to ignore files like `node_modules`, `dist`, `.env`, etc.

### `eslint.config.mjs` (root)
- Possibly shared lint rules across both client and server.

### `lerna.json`
- Using **Lerna** to manage this monorepo.
- Controls package versioning and publishing.

### `package.json` (root)
- The monorepo manager file.
- Defines workspaces pointing to `packages/client` and `packages/server`.

### `lerna-debug.log`, `.DS_Store`
- System/trash/debug files. Can be safely ignored or deleted.
