# @docvia/cli

CLI for [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler.

## Install

```bash
pnpm add -D @docvia/cli
pnpm add @docvia/renderer-react   # or @docvia/renderer-svelte
```

## Usage

```bash
docvia init [-d <dir>] [-r react|svelte|none] [-f]   # scaffold a project
docvia build [--docs <dir>] [--out <dir>] [--config <path>] [--no-cache]
docvia dev   [--docs <dir>] [--out <dir>] [--config <path>]
docvia preview [--out <dir>] [-p <port>]
```

| Command | What it does |
|---|---|
| `init` | Creates `docs/` with sample pages and a working `docvia.config.ts`. Autodetects `react` / `svelte` from your project's `package.json` or pass `--renderer` explicitly. Refuses to overwrite an existing config without `--force`. |
| `build` | Reads the config, compiles every Markdown file to the module graph in `<outDir>/`, and persists `.docvia.cache.json`. Skips unchanged files. Pass `--no-cache` to force a full rebuild. |
| `dev` | Initial build, then watches `sourceDir` and the config file. Rebuilds incrementally with a build lock to prevent races. Reloads the config when it changes. Closes cleanly on Ctrl+C. |
| `preview` | Serves `<outDir>/` via `sirv`. Sanity check only — embed docvia in your Vite/Next.js app for a real preview. |

## Programmatic use

`@docvia/cli` re-exports `defineConfig` so your `docvia.config.ts` can stay
small:

```ts
import { defineConfig } from "@docvia/cli";
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({ theme: "github-dark" }),
  }),
});
```

## License

MIT
