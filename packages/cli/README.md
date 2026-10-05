# @docvia/cli

CLI for [docvia](https://github.com/kanakkholwal/docvia), a Markdown
documentation compiler.

## Install

```bash
pnpm add -D @docvia/cli
pnpm add @docvia/source @docvia/renderer-react   # or @docvia/renderer-svelte
```

Framework apps do not need the CLI to build: `@docvia/plugin-vite` or
`@docvia/plugin-next` compiles `defineDocs()` collections in-process. The
compile commands below drive the standalone compiler over legacy config
collections (`sourceDir` / `collections` in `docvia.config.ts`).

## Usage

```bash
docvia init [dir] [--yes] [--no-install] [--framework <name>] [--pm <manager>] [-f]
docvia build [--docs <dir>] [--out <dir>] [--config <path>] [-v]
docvia dev   [--docs <dir>] [--out <dir>] [--config <path>] [-v]
docvia sync  [--config <path>]
docvia preview [--out <dir>] [-p <port>]
```

| Command | What it does |
|---|---|
| `init` | Adds docs to a Next.js, SvelteKit or TanStack Start app: detects the framework, package manager and import aliases, writes `content/docs`, `lib/source.ts`, docs routes and a search route, patches the bundler config and installs the packages. Keeps existing files unless `--force`. |
| `build` | Reads the config and compiles every Markdown file to the module graph in `<outDir>/`. |
| `dev` | Initial build, then watches `sourceDir` and the config file. Rebuilds incrementally with a build lock to prevent races. Reloads the config when it changes. Closes cleanly on Ctrl+C. |
| `sync` | Writes legacy collection types (`<outDir>/types.d.ts`, `env.d.ts`) without a bundler. Not needed with `defineDocs()`. |
| `preview` | Serves `<outDir>/` via `sirv`. Sanity check only; embed docvia in your Vite/Next.js app for a real preview. |

## Config

`@docvia/cli` is a dev dependency only. It re-exports `defineConfig`, but import
it from your framework plugin (`@docvia/plugin-vite` or `@docvia/plugin-next`):

```ts
import { defineConfig } from "@docvia/plugin-vite";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createReactRenderer(),
  plugins: [shiki({ theme: "github-dark" })],
});
```

## License

MIT
