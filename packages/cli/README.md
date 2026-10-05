# @docvia/cli

CLI for [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler.

## Install

```bash
pnpm add -D @docvia/cli
pnpm add @docvia/source @docvia/renderer-react   # or @docvia/renderer-svelte
```

## Usage

```bash
docvia init [-d <dir>] [-r react|svelte|none] [-f]   # scaffold a project
docvia build [--docs <dir>] [--out <dir>] [--config <path>] [--no-cache]
docvia dev   [--docs <dir>] [--out <dir>] [--config <path>]
docvia sync  [--config <path>]
docvia preview [--out <dir>] [-p <port>]
```

| Command | What it does |
|---|---|
| `init` | Creates `docs/` with sample pages and a working `docvia.config.ts`. Autodetects `react` / `svelte` from your project's `package.json` or pass `--renderer` explicitly. Refuses to overwrite an existing config without `--force`. |
| `build` | Reads the config, compiles every Markdown file to the module graph in `<outDir>/`, and persists `.docvia.cache.json`. Skips unchanged files. Pass `--no-cache` to force a full rebuild. |
| `dev` | Initial build, then watches `sourceDir` and the config file. Rebuilds incrementally with a build lock to prevent races. Reloads the config when it changes. Closes cleanly on Ctrl+C. |
| `sync` | Writes `.docvia/types.d.ts` and `.docvia/env.d.ts` without a bundler. Run it before `tsc` / `svelte-check` in CI: `docvia sync && svelte-kit sync && svelte-check`. |
| `preview` | Serves `<outDir>/` via `sirv`. Sanity check only; embed docvia in your Vite/Next.js app for a real preview. |

## Config

`@docvia/cli` is a dev dependency only. It re-exports `defineConfig`, but import
it from your framework plugin (`@docvia/plugin-vite` or `@docvia/plugin-next`):

```ts
import { defineConfig } from "@docvia/plugin-vite";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [shiki({ theme: "github-dark" })],
});
```

## License

MIT
