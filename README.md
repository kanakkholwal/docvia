# docvia

A Markdown documentation compiler. docvia turns a directory of Markdown into
typed, pre-rendered content for React, Svelte, or any framework with a renderer
adapter — and it runs in three modes from one shared compile core:

- **Build** — compile the whole tree ahead of time into a typed module graph.
- **Dev** — compile in-process inside the framework dev server, recompiling
  incrementally on every file change.
- **SSR** — render a single document per request, on Node or the edge.

All three sit on the same long-lived `CompileService` (`@docvia/runtime`), so
output is byte-identical regardless of mode. See [MODES.md](./MODES.md) for the
full breakdown.

## Why docvia

- **IR-based.** Markdown is parsed, sanitized, and transformed into an
  Intermediate Representation once; renderers turn that IR into framework output.
- **Typed frontmatter.** Extend the built-in schema with a Zod object and docvia
  generates a `Frontmatter` interface for every collection.
- **Incremental.** A content-addressed cache skips unchanged files — across
  builds and, in dev, on every keystroke.
- **Pluggable.** Five hook points across the pipeline, plus build-time syntax
  highlighting that bakes HTML into the IR so no highlighter ships to the browser.
- **Framework adapters.** First-party React and Svelte renderers, an in-process
  Vite plugin, and a Next.js wrapper (webpack + Turbopack).

## Install

```bash
pnpm add -D @docvia/cli
pnpm add @docvia/renderer-react   # or @docvia/renderer-svelte
```

## Quick start

```bash
npx docvia init                  # scaffold docs/ + docvia.config.ts
npx docvia build                 # compile to .docvia/
npx docvia dev                   # watch & recompile incrementally
```

Minimal `docvia.config.ts`:

```ts
import { defineConfig } from "@docvia/cli";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [shiki({ theme: "github-dark" })],
});
```

After `docvia build`, import the generated source:

```ts
// Vite resolves a virtual module; Next.js aliases the bare specifier.
import { docs } from "virtual:docvia/source"; // Next.js: "docvia/source"

const page = await docs.getPage(["getting-started"]); // slug segments
const all = docs.getPages();                          // metadata for every page
const tree = docs.pageTree;                           // navigation tree
```

## Framework integration

The recommended setup runs docvia **in-process** inside your bundler — no
separate `docvia build` step, incremental recompilation in dev, and a virtual
source module (`virtual:docvia/source` on Vite, the aliased `docvia/source` on
Next.js) so nothing is written to disk during development.

### SvelteKit (Vite)

```bash
pnpm add -D @docvia/plugin-vite @docvia/cli
pnpm add @docvia/renderer-svelte @docvia/source
```

```ts
// vite.config.ts
import { docvia } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [sveltekit(), docvia(docviaConfig)],
});
```

`docvia()` runs the `CompileService` in-process: it serves `virtual:docvia/source`
(and `virtual:docvia/source/browser`) as virtual modules in dev with incremental
HMR, and serves them from the `load` hook for production builds too. The config must use the Svelte renderer
(`createSvelteRenderer` from `@docvia/renderer-svelte/node`). Consume pages in a
catch-all route via `docs.getPage(...)` and render them with the `Renderer`
component from `@docvia/renderer-svelte`. See
[`examples/demo-svelte`](./examples/demo-svelte) and [`apps/docs`](./apps/docs)
for working setups.

### Next.js

```bash
pnpm add -D @docvia/plugin-next @docvia/cli
pnpm add @docvia/renderer-react @docvia/source react react-dom
```

```js
// next.config.mjs
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia({ configPath: "./docvia.config.ts" })({
  reactStrictMode: true,
});
```

`withDocvia` drives the `CompileService` when the Next config is evaluated,
aliases `docvia/source` for **both webpack and Turbopack**, and runs an
incremental watcher in dev. See [`examples/demo-next`](./examples/demo-next).

### Server-side rendering

Markdown is loaded **in place** as a module via the `?docvia` loader (Vite,
webpack, and Turbopack), so a framework app renders pages directly through its
renderer — including on the edge — with no separate content store. One module
imports the pages eagerly (server/SSR, bundled), another lazily (client,
code-split per page):

```ts
// Vite (SvelteKit, etc.) — Vite virtual-module convention:
import { docs } from "virtual:docvia/source";          // server / SSR (eager)
import { docs } from "virtual:docvia/source/browser";  // browser (lazy, code-split)

// Next.js — the wrapper aliases the bare specifier instead:
import { docs } from "docvia/source";
import { docs } from "docvia/source/browser";

const page = await docs.getPage(["getting-started"]);
```

For a **non-framework Node server** that renders per request, `@docvia/ssr`
renders IR resolved by a content source — a live `CompileService` already is
one, so pass it directly:

```ts
import { createDocviaSSR } from "@docvia/ssr";

const ssr = createDocviaSSR({ provider: service }); // or a (collection, slug) => IR fn
const page = await ssr.render("docs", "getting-started");
```

Rendered pages are cached in an in-memory LRU keyed by content hash.

### Standalone preview

`docvia preview` serves `.docvia/` over `sirv` — a sanity check for the compiled
output only. It is not a runtime; use a framework integration for a real site.

## Packages

| Package | Version | Purpose |
|---|---|---|
| [`@docvia/cli`](https://www.npmjs.com/package/@docvia/cli) | [![npm](https://img.shields.io/npm/v/@docvia/cli.svg)](https://www.npmjs.com/package/@docvia/cli) | `init` / `build` / `dev` / `preview` commands. |
| [`@docvia/runtime`](https://www.npmjs.com/package/@docvia/runtime) | [![npm](https://img.shields.io/npm/v/@docvia/runtime.svg)](https://www.npmjs.com/package/@docvia/runtime) | `CompileService` — the stateful compile core shared by build, dev, and SSR. |
| [`@docvia/compiler`](https://www.npmjs.com/package/@docvia/compiler) | [![npm](https://img.shields.io/npm/v/@docvia/compiler.svg)](https://www.npmjs.com/package/@docvia/compiler) | Batch build entry (`compile()`), a thin wrapper over `CompileService`. |
| [`@docvia/core`](https://www.npmjs.com/package/@docvia/core) | [![npm](https://img.shields.io/npm/v/@docvia/core.svg)](https://www.npmjs.com/package/@docvia/core) | Markdown parsing pipeline (`unified` + `remark` + `rehype`). |
| [`@docvia/ir`](https://www.npmjs.com/package/@docvia/ir) | [![npm](https://img.shields.io/npm/v/@docvia/ir.svg)](https://www.npmjs.com/package/@docvia/ir) | Intermediate representation, error system, AST → IR transform. |
| [`@docvia/schema`](https://www.npmjs.com/package/@docvia/schema) | [![npm](https://img.shields.io/npm/v/@docvia/schema.svg)](https://www.npmjs.com/package/@docvia/schema) | Frontmatter validation (Zod), YAML extraction, TS codegen. |
| [`@docvia/plugins`](https://www.npmjs.com/package/@docvia/plugins) | [![npm](https://img.shields.io/npm/v/@docvia/plugins.svg)](https://www.npmjs.com/package/@docvia/plugins) | `defineConfig`, `loadConfig`, `PluginRunner`. |
| [`@docvia/ssr`](https://www.npmjs.com/package/@docvia/ssr) | [![npm](https://img.shields.io/npm/v/@docvia/ssr.svg)](https://www.npmjs.com/package/@docvia/ssr) | Request-time rendering for non-framework Node servers. |
| [`@docvia/renderer-core`](https://www.npmjs.com/package/@docvia/renderer-core) | [![npm](https://img.shields.io/npm/v/@docvia/renderer-core.svg)](https://www.npmjs.com/package/@docvia/renderer-core) | Framework-agnostic rendering engine and default renderers. |
| [`@docvia/renderer-react`](https://www.npmjs.com/package/@docvia/renderer-react) | [![npm](https://img.shields.io/npm/v/@docvia/renderer-react.svg)](https://www.npmjs.com/package/@docvia/renderer-react) | React renderer adapter (server + `./client` hydration). |
| [`@docvia/renderer-svelte`](https://www.npmjs.com/package/@docvia/renderer-svelte) | [![npm](https://img.shields.io/npm/v/@docvia/renderer-svelte.svg)](https://www.npmjs.com/package/@docvia/renderer-svelte) | Svelte renderer adapter. |
| [`@docvia/search`](https://www.npmjs.com/package/@docvia/search) | [![npm](https://img.shields.io/npm/v/@docvia/search.svg)](https://www.npmjs.com/package/@docvia/search) | Section-level Orama indexing and client search helper. |
| [`@docvia/source`](https://www.npmjs.com/package/@docvia/source) | [![npm](https://img.shields.io/npm/v/@docvia/source.svg)](https://www.npmjs.com/package/@docvia/source) | Runtime collection helpers and Node markdown / IR-chunk loader. |
| [`@docvia/plugin-vite`](https://www.npmjs.com/package/@docvia/plugin-vite) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-vite.svg)](https://www.npmjs.com/package/@docvia/plugin-vite) | In-process Vite plugin (`docvia()`) with virtual modules + HMR. |
| [`@docvia/plugin-next`](https://www.npmjs.com/package/@docvia/plugin-next) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-next.svg)](https://www.npmjs.com/package/@docvia/plugin-next) | Next.js wrapper (`withDocvia`) — webpack + Turbopack. |
| [`@docvia/plugin-shiki`](https://www.npmjs.com/package/@docvia/plugin-shiki) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-shiki.svg)](https://www.npmjs.com/package/@docvia/plugin-shiki) | Build-time syntax highlighting via Shiki (pluggable). |
| [`@docvia/plugin-openapi`](https://www.npmjs.com/package/@docvia/plugin-openapi) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-openapi.svg)](https://www.npmjs.com/package/@docvia/plugin-openapi) | Generate reference pages from an OpenAPI spec. |

## Status

v0.2 preview. APIs are stabilizing; expect breaking changes before v1.0. See
[`.changeset/`](./.changeset) for in-flight release notes and
[documentation.md](./documentation.md) for architecture notes.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the local
setup, watch modes, and release workflow.

## License

MIT
