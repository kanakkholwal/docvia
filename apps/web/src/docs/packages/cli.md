---
title: "@docvia/cli"
description: "The docvia command-line interface: scaffold, build, watch, sync types, and preview documentation projects."
eyebrow: "Packages"
order: 1
---

`@docvia/cli` ships the `docvia` binary. It is a dev dependency only. It also re-exports `defineConfig`, but config files should import it from `@docvia/plugin-vite` or `@docvia/plugin-next`.

Apps that declare collections with `defineDocs()` do not need the CLI at runtime: the Vite or Next.js plugin compiles pages on demand. `build`, `dev` and `preview` drive the standalone compiler, which writes a `.docvia/` module graph for hosts without a docvia bundler plugin.

## Install

```bash
pnpm add -D @docvia/cli
```

Once installed, the `docvia` binary is available through your package runner:

```bash
pnpm exec docvia --help
```

A typical `package.json` wires the commands into scripts:

```json
{
  "scripts": {
    "docs:dev": "docvia dev",
    "docs:build": "docvia build",
    "docs:preview": "docvia preview"
  }
}
```

## Package exports

### `exports`

| Subpath | Resolves to | Purpose |
|---|---|---|
| `.` | `./dist/index.js` | Programmatic API: `runCli`, `defineConfig`, and re-exported config types. |
| `./package.json` | `./package.json` | Package metadata. |

### `bin`

| Binary | Script | Purpose |
|---|---|---|
| `docvia` | `./bin.mjs` | The CLI executable. The shim calls `runCli()` directly. |

## Programmatic API

The package's `.` entry is importable in addition to being runnable as a binary.

### `runCli`

```ts
function runCli(argv?: readonly string[]): Promise<void>;
```

The programmatic entry point. It builds the underlying [commander](https://github.com/tj/commander.js) program and invokes `parseAsync`. The promise resolves once the parsed command finishes and rejects on parser errors. `argv` defaults to `process.argv`, so passing nothing replicates a direct shell invocation.

```ts
import { runCli } from "@docvia/cli";

// Equivalent to running `docvia build --verbose`
await runCli(["node", "docvia", "build", "--verbose"]);
```

The `bin.mjs` shim calls `runCli()` explicitly; any downstream tooling that wants to run docvia in-process can do the same.

### `defineConfig`

Re-exported from `@docvia/plugins`. It is the helper used in `docvia.config.ts` to get full type-checking and editor completion on the config object. Since the CLI is a dev-only tool, import it from your framework plugin instead:

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/plugin-vite"; // or @docvia/plugin-next

import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
  renderer: createSvelteRenderer(),
});
```

### Re-exported types

| Type | Source | Purpose |
|---|---|---|
| `docviaConfig` | `@docvia/ir` | The shape of a docvia configuration object. |
| `docviaPlugin` | `@docvia/ir` | The shape of a compiler plugin. |

## Global options

### `docvia --version`

Prints the installed CLI version. The version is read from `process.env.npm_package_version` and falls back to `0.1.0` when that variable is absent.

## Commands

The CLI exposes five commands: `init`, `build`, `dev`, `sync`, and `preview`.

### `docvia init`

Add docs to an existing Next.js, SvelteKit or TanStack Start app.

```bash
pnpm dlx @docvia/cli init [dir] [--yes] [--no-install] [--framework <name>] [--pm <manager>] [-f]
```

| Flag | Default | Description |
|---|---|---|
| `[dir]` | `.` | The app directory. |
| `-y, --yes` | `false` | Accept the detected setup without prompting. |
| `--no-install` | installs | Print the install commands instead of running them. |
| `--framework <name>` | detected | `next`, `sveltekit`, `tanstack-start` or `standalone`. |
| `--pm <manager>` | detected | `npm`, `pnpm`, `yarn` or `bun`. |
| `-f, --force` | `false` | Replace files that already exist. |

What it detects:

- **Framework** from `package.json`: `next`, `@sveltejs/kit` or `@tanstack/react-start`.
- **Package manager** from the lockfile, then the `packageManager` field, then the command that ran it.
- **Import aliases** from `tsconfig.json` `paths` and `package.json` `imports` (`@/lib/source`, `#lib/source.ts`), with relative imports as the fallback.
- **`src/` layout** for Next.js apps that use `src/app`.
- **Tailwind v4**: adds `@source not "../content"` to the app's Tailwind stylesheet, so a
  Markdown edit does not rebuild the app's CSS (about 9 s per edit through Next.js PostCSS).

What it writes, shown for Next.js. SvelteKit and TanStack Start get the same pieces as their own route files:

| File | Purpose |
|---|---|
| `content/docs/index.md`, `content/docs/guides/` | Starter pages and a `meta.json` |
| `lib/source.ts` | `defineDocs()` and `loader()` |
| `app/docs/layout.tsx`, `app/docs/[[...slug]]/page.tsx`, `docs.css` | Sidebar, page, table of contents, starter styles |
| `app/api/search/route.ts` | Search endpoint |
| `components/docs-tree.tsx`, `components/docvia-client.tsx` | Sidebar tree and code-tab switching |
| `next.config.ts` | Wrapped in `withDocvia()` (Vite apps get `docvia()` in `plugins`) |

Existing files are kept unless you pass `--force`. No `docvia.config.ts` is written: the
renderer is picked from your dependencies and Shiki is enabled when installed. Add a config
file only to register components or change plugins.

In a directory without a supported framework, `init` sets up a standalone project for
`docvia build` and `docvia dev` instead.

### `docvia build`

Compiles every page once with `CompileService` and writes the module graph to `outDir`.

| Flag | Default | Behavior |
|---|---|---|
| `--docs <dir>` | from config | Override the config's `sourceDir`. |
| `--out <dir>` | from config | Override the config's `outDir`. |
| `--config <path>` | `./docvia.config.ts` | Path to the config file. |
| `--verbose`, `-v` | `false` | Show intermediate build steps. |

`build` throws a `docviaError` with code `CONFIG_ERROR` when the docs directory is missing or no renderer is configured. There is no disk cache: every run compiles in memory.

On success it prints the build duration along with file and page counts.

```bash
# Standard build
docvia build

# Overridden paths
docvia build --docs content --out dist/docs
```

### `docvia dev`

Runs an initial compile, then watches for changes and rebuilds incrementally.

| Flag | Default | Behavior |
|---|---|---|
| `--docs <dir>` | from config | Override the config's `sourceDir`. |
| `--out <dir>` | from config | Override the config's `outDir`. |
| `--config <path>` | `./docvia.config.ts` | Path to the config file. |
| `--verbose`, `-v` | `false` | Show each changed file as it rebuilds. |

Behavior:

- After the initial compile, [chokidar](https://github.com/paulmillr/chokidar) watches the source directory and the config file.
- The watcher uses `awaitWriteFinish` with a `stabilityThreshold` of 50 ms and a `pollInterval` of 10 ms, plus a 20 ms debounce, so rapid saves coalesce into a single rebuild.
- A build lock serializes rebuilds, so overlapping change events never run two compilations at once.
- When the config file changes, the config is reloaded before the next rebuild.
- `SIGINT` and `SIGTERM` trigger a graceful shutdown of the watcher.

```bash
docvia dev --docs content
```

### `docvia sync`

For legacy config collections only: writes `.docvia/types.d.ts` and `.docvia/env.d.ts` from frontmatter, without a bundler, like `svelte-kit sync`. `defineDocs()` apps get their types from their own source file and do not need it.

| Flag | Default | Behavior |
|---|---|---|
| `--config <path>` | auto-detected | Path to the config file. |

```bash
docvia sync && svelte-kit sync && svelte-check
```

The same routine is available programmatically as `syncTypes({ cwd?, configPath? })` from `@docvia/runtime`.

### `docvia preview`

Serves the already-compiled `.docvia/` output over a local HTTP server using [sirv](https://github.com/lukeed/sirv).

| Flag | Alias | Default | Behavior |
|---|---|---|---|
| `--out <dir>` | none | `.docvia` | Output directory to serve. |
| `--port <port>` | `-p` | `4173` | Port to listen on. |

The command validates that the port is within the valid range before binding via `node:http`.

> `preview` is a sanity check for the compiled artifacts, **not** a runtime.

```bash
docvia preview --out .docvia --port 5000
```

## End-to-end example

```bash
# Inside a Next.js, SvelteKit or TanStack Start app
pnpm dlx @docvia/cli init
pnpm dev
```
