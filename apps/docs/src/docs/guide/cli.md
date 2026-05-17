---
title: "CLI reference"
description: "Every docvia command and flag — init, build, dev, and preview."
eyebrow: "Guide"
order: 3
---

The `docvia` command is provided by [`@docvia/cli`](/packages/cli). Install it
as a dev dependency and invoke it through your package manager:

```bash
pnpm add -D @docvia/cli
npx docvia <command>
```

Run `docvia --version` to print the installed version.

## docvia init

Scaffold a new docvia project.

```bash
docvia init [-d <dir>] [-r react|svelte|none] [-f]
```

| Flag | Default | Description |
|---|---|---|
| `-d, --dir <dir>` | `"."` | Project directory to scaffold into. |
| `-r, --renderer <name>` | autodetected | `react`, `svelte`, or `none`. |
| `-f, --force` | `false` | Overwrite an existing `docvia.config.ts`. |

When `--renderer` is omitted, `init` reads the target `package.json`: `svelte`
or `@sveltejs/kit` selects the Svelte template, `react` or `next` selects the
React template, and anything else falls back to `none`.

`init` creates a `docs/` directory with sample pages (`index.md`,
`getting-started.md`, `components.md`) and a working `docvia.config.ts`. It
refuses to overwrite an existing config unless you pass `--force`, and prints
the install commands for the renderer you chose.

## docvia build

Compile every Markdown file once.

```bash
docvia build [--docs <dir>] [--out <dir>] [--config <path>] [--no-cache]
```

| Flag | Default | Description |
|---|---|---|
| `--docs <dir>` | from config | Override `sourceDir`. |
| `--out <dir>` | from config | Override `outDir`. |
| `--config <path>` | `./docvia.config.ts` | Path to the config file. |
| `--no-cache` | — | Disable the incremental cache; force a full rebuild. |

`build` loads the config, then compiles every file to the module graph in
`outDir` and persists `.docvia.cache.json`. It fails with a `CONFIG_ERROR` if
the docs directory is missing or no `renderer` is configured. On success it
prints the build duration and the file and page counts, noting how many files
were served from cache.

## docvia dev

Build once, then watch and rebuild incrementally.

```bash
docvia dev [--docs <dir>] [--out <dir>] [--config <path>]
```

| Flag | Default | Description |
|---|---|---|
| `--docs <dir>` | from config | Override `sourceDir`. |
| `--out <dir>` | from config | Override `outDir`. |
| `--config <path>` | `./docvia.config.ts` | Path to the config file. |

`dev` does an initial build, then watches both `sourceDir` and the config file
on a single long-lived `CompileService`. Each change recompiles only the
affected files through the service's incremental `invalidate()` — a full
rebuild is not repeated per change. A config change recreates the service. An
initial-build failure does not stop the watcher — fix the error and save again.
`Ctrl+C` shuts the watcher down cleanly.

> `docvia dev` is a standalone watcher for the `.docvia/` output. When docvia
> is embedded in a Vite or Next.js app, the framework integration runs the
> compile core in-process and handles watching itself — see
> [Framework integration](/guide/frameworks).

## docvia preview

Serve the compiled `.docvia/` output.

```bash
docvia preview [--out <dir>] [-p <port>]
```

| Flag | Default | Description |
|---|---|---|
| `--out <dir>` | `.docvia` | Output directory to serve. |
| `-p, --port <port>` | `4173` | Port to listen on. |

`preview` serves `outDir` over `sirv`. It is a sanity check for the compiled
module graph only — it is not a runtime. Use a framework integration for a real
site.

## Programmatic use

The CLI is also importable. `runCli` is the entry point the `docvia` binary
calls, and `defineConfig` is re-exported for authoring `docvia.config.ts`:

```ts
import { runCli } from "@docvia/cli";

await runCli(["node", "docvia", "build", "--no-cache"]);
```

See [`@docvia/cli`](/packages/cli) for the full package reference.
