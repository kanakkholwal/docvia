---
title: "Getting started"
description: "Install the CLI, scaffold a project, and compile your first build in three commands."
eyebrow: "Introduction"
order: 1
---

docvia is distributed as a set of `@docvia/*` packages on npm. The
`@docvia/cli` package gives you the `docvia` command; a renderer package gives
you the framework adapter.

## Install

```bash
pnpm add -D @docvia/cli
pnpm add @docvia/renderer-react   # or @docvia/renderer-svelte
```

The CLI is the only required dev dependency. The renderer is a runtime
dependency because its types and the generated module graph reference it.

## Scaffold

```bash
npx docvia init
```

The `init` command autodetects your renderer from `package.json` — it picks
`svelte` when it sees `svelte` or `@sveltejs/kit`, `react` when it sees `react`
or `next`, and `none` otherwise. Pass `--renderer react` or
`--renderer svelte` to choose explicitly. It creates a `docs/` directory with
sample pages and a working `docvia.config.ts`, and refuses to overwrite an
existing config without `--force`.

## Build

```bash
npx docvia build
```

The first run compiles every Markdown file in `docs/` and writes a five-file
module graph to `.docvia/`:

| File | Purpose |
|---|---|
| `source.ts` | The typed collection helper — `getPage`, `getPages`, `pageTree`. |
| `dynamic.ts` | Lazy and eager module loaders for each page. |
| `registry.ts` | The component registry for `:::component` directives. |
| `types.d.ts` | Generated frontmatter and route-key types. |
| `.docvia.cache.json` | The incremental build cache. |

A project-root `docvia-env.d.ts` is also written so `docvia/source` resolves
in TypeScript. Subsequent runs read `.docvia.cache.json` and skip files whose
content hash is unchanged — see [Incremental builds](/guide/incremental-builds).

## Watch

```bash
npx docvia dev
```

The `dev` command does an initial build, then watches both your source
directory and your config file. Rebuilds are debounced and serialized behind a
build lock, so concurrent saves never race on the generated module graph. It
reloads the config when it changes and shuts down cleanly on `Ctrl+C`.

## Use it in an app

`docvia build` only produces the `.docvia/` module graph — it does not run a
server. To render docs in a real app, pair the build with a framework
integration. The pattern is always: run `docvia build` before the framework
dev/build step, then import from `docvia/source`.

See [Framework integration](/guide/frameworks) for SvelteKit, Next.js, and
plain Vite setups.

## A minimal config

```ts
import { defineConfig } from "@docvia/cli";
import {
  createReactRenderer,
  createShikiHighlighter,
} from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["typescript", "bash", "json"],
    }),
  }),
});
```

Every option is documented in the [Configuration reference](/guide/configuration).
