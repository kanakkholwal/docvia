---
title: "@docvia/cli"
description: "The docvia command-line interface — scaffold, build, watch, and preview documentation projects."
eyebrow: "Packages"
order: 1
---

`@docvia/cli` is the command-line entry point for docvia. It ships the `docvia` binary, loads your `docvia.config.ts`, and drives `@docvia/compiler`'s `compile()` routine. Beyond the four commands, it re-exports `defineConfig` so config files can import everything they need from a single package.

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
| `.` | `./dist/index.mjs` | Programmatic API: `runCli`, `defineConfig`, and re-exported config types. |

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

// Equivalent to running `docvia build --no-cache`
await runCli(["node", "docvia", "build", "--no-cache"]);
```

The `bin.mjs` shim calls `runCli()` explicitly; any downstream tooling that wants to run docvia in-process can do the same.

### `defineConfig`

```ts
import { defineConfig } from "@docvia/cli";
```

Re-exported from `@docvia/plugins`. It is the identity helper used in `docvia.config.ts` to get full type-checking and editor completion on the config object.

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/cli";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
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

The CLI exposes four commands: `init`, `build`, `dev`, and `preview`.

### `docvia init`

Scaffolds a new docvia project: a `docs/` directory with three starter Markdown files plus a `docvia.config.ts` at the project root.

| Flag | Alias | Default | Behavior |
|---|---|---|---|
| `--dir <dir>` | `-d` | `.` | Target project directory. |
| `--renderer <renderer>` | `-r` | autodetected | Renderer template: `react`, `svelte`, or `none`. |
| `--force` | `-f` | `false` | Overwrite an existing `docvia.config.ts`. |

When `--renderer` is omitted, the renderer is autodetected from `package.json` dependencies:

- `svelte` or `@sveltejs/kit` present → `svelte`
- `react` or `next` present → `react`
- otherwise → `none`

Files created:

- `docs/index.md`
- `docs/getting-started.md`
- `docs/components.md`
- `docvia.config.ts`

After scaffolding, `init` prints install hints for the packages that match the chosen renderer.

```bash
# Scaffold into the current directory, autodetecting the renderer
docvia init

# Scaffold a Svelte project into ./website, overwriting any existing config
docvia init --dir ./website --renderer svelte --force
```

### `docvia build`

Compiles documentation once. It loads the config, validates the environment, and calls `compile()`.

| Flag | Default | Behavior |
|---|---|---|
| `--docs <dir>` | from config | Override the config's `sourceDir`. |
| `--out <dir>` | from config | Override the config's `outDir`. |
| `--config <path>` | `./docvia.config.ts` | Path to the config file. |
| `--no-cache` | cache enabled | Force a full rebuild, disabling the incremental cache. |

`build` throws a `docviaError` with code `CONFIG_ERROR` when the docs directory is missing or no renderer is configured. It passes `incremental: !noCache` to `compile()` — so omitting `--no-cache` keeps the incremental cache, and passing it forces a clean build.

On success it prints the build duration along with file and page counts.

```bash
# Standard build
docvia build

# Full rebuild with overridden paths
docvia build --docs content --out dist/docs --no-cache
```

### `docvia dev`

Runs an initial compile, then watches for changes and rebuilds incrementally.

| Flag | Default | Behavior |
|---|---|---|
| `--docs <dir>` | from config | Override the config's `sourceDir`. |
| `--out <dir>` | from config | Override the config's `outDir`. |
| `--config <path>` | `./docvia.config.ts` | Path to the config file. |

Behavior:

- After the initial compile, [chokidar](https://github.com/paulmillr/chokidar) watches the source directory and the config file.
- The watcher uses `awaitWriteFinish` with a `stabilityThreshold` of 50 ms and a `pollInterval` of 10 ms, plus a 20 ms debounce, so rapid saves coalesce into a single rebuild.
- A build lock serializes rebuilds — overlapping change events never run two compilations at once.
- When the config file changes, the config is reloaded before the next rebuild.
- `SIGINT` and `SIGTERM` trigger a graceful shutdown of the watcher.

```bash
docvia dev --docs content
```

### `docvia preview`

Serves the already-compiled `.docvia/` output over a local HTTP server using [sirv](https://github.com/lukeed/sirv).

| Flag | Alias | Default | Behavior |
|---|---|---|---|
| `--out <dir>` | — | `.docvia` | Output directory to serve. |
| `--port <port>` | `-p` | `4173` | Port to listen on. |

The command validates that the port is within the valid range before binding via `node:http`.

> `preview` is a sanity check for the compiled artifacts — it is **not** a runtime. Render the compiled output inside your framework app (Vite, Next.js, SvelteKit) for the real integration.

```bash
docvia preview --out .docvia --port 5000
```

## End-to-end example

```bash
# 1. Scaffold
docvia init --renderer react

# 2. Iterate
docvia dev

# 3. Ship
docvia build
docvia preview
```
