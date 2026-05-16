# docvia

A Markdown documentation compiler. docvia turns a directory of Markdown into
typed, pre-rendered content for React, Svelte, or any framework with a renderer
adapter — and runs in three modes from one shared compile core:

- **Build** — compile the whole tree ahead of time into a typed module graph.
- **Dev** — compile in-process inside the framework dev server, recompiling
  incrementally on every file change (no separate build script).
- **SSR** — render a single document per request, on Node or the edge.

All three sit on the same long-lived `CompileService` (`@docvia/runtime`), so
output is byte-identical regardless of mode. See [MODES.md](./MODES.md) for the
full breakdown.

- **IR-based.** Markdown is parsed, sanitized, and transformed into an
  Intermediate Representation (IR) once; renderers turn IR into framework output.
- **Typed frontmatter.** Extend the built-in schema with a Zod object and
  docvia generates a `Frontmatter` interface for every collection.
- **Incremental.** A content-addressed cache skips unchanged files — across
  builds and, in dev, on every keystroke via `service.invalidate()`.
- **Pluggable pipeline.** Five hook points (`beforeParse`, `afterParse`,
  `beforeTransform`, `afterTransform`, `beforeRender`).
- **Pluggable syntax highlighting.** Highlighting is a build-time plugin
  (`@docvia/plugin-shiki`) that bakes highlighted HTML into the IR — zero
  highlighter ships to the browser or the edge bundle.
- **Framework adapters.** First-party React and Svelte renderers; an in-process
  Vite plugin and a Next.js wrapper (webpack + Turbopack).

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
import { docs } from "docvia/source"; // generated into .docvia/

const page = await docs.getPage(["getting-started"]); // slug segments
const all = docs.getPages();                          // metadata for every page
const tree = docs.pageTree;                           // navigation tree
```

## Framework integration

The recommended setup runs docvia **in-process** inside your bundler — no
separate `docvia build` step, incremental recompilation in dev, and a virtual
`docvia/source` module so nothing is written to disk during development.

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

That's it — no `predev` / `prebuild` hook. `docvia()` runs the `CompileService`
in-process: it serves `docvia/source` as a virtual module in dev with
incremental HMR, and emits the on-disk module graph for production builds.

The `docvia.config.ts` must use the Svelte renderer (`createSvelteRenderer`
from `@docvia/renderer-svelte/node`). Consume pages in a catch-all route via
`docs.getPage(...)` and render them with the `Renderer` component from
`@docvia/renderer-svelte`. See [`examples/demo-svelte`](./examples/demo-svelte)
and [`apps/docs`](./apps/docs) for working setups.

> The legacy `docviaSourcePlugin()` + `docviaMarkdownPlugin()` exports remain
> available for setups that still run a separate `docvia build` step.

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

For request-time rendering (Node or Cloudflare Workers / edge) use
`@docvia/ssr`:

```ts
import { createDocviaSSR, BundledContentProvider, createGlobChunkLoader } from "@docvia/ssr";

// Edge-safe: serves per-route IR chunks built into .docvia/ir/.
const ssr = createDocviaSSR({
  provider: BundledContentProvider(
    createGlobChunkLoader(import.meta.glob("/.docvia/ir/**/*.json")),
  ),
});

const page = await ssr.render("docs", "getting-started");
```

On Node, `@docvia/ssr/node`'s `FsContentProvider` wraps a live `CompileService`
instead. Rendered pages are cached in an in-memory LRU keyed by content hash.

### Standalone preview

`docvia preview` serves `.docvia/` over `sirv` — a sanity check for the compiled
output only. It is not a runtime; use a framework integration for a real site.

## Packages

| Package | Purpose |
|---|---|
| `@docvia/cli` | `init` / `build` / `dev` / `preview` commands. |
| `@docvia/runtime` | `CompileService` — the stateful compile core shared by build, dev, and SSR. |
| `@docvia/compiler` | Batch build entry (`compile()`), a thin wrapper over `CompileService`. |
| `@docvia/core` | Markdown parsing pipeline (`unified` + `remark` + `rehype`). |
| `@docvia/ir` | Intermediate representation, error system, AST → IR transform. |
| `@docvia/schema` | Frontmatter validation (Zod), YAML extraction, TS codegen. |
| `@docvia/plugins` | `defineConfig`, `loadConfig`, `PluginRunner`. |
| `@docvia/ssr` | Request-time rendering for Node and edge runtimes. |
| `@docvia/renderer-core` | Framework-agnostic rendering engine and default renderers. |
| `@docvia/renderer-react` | React renderer adapter (server + `./client` hydration). |
| `@docvia/renderer-svelte` | Svelte renderer adapter. |
| `@docvia/search` | Section-level Orama indexing and client search helper. |
| `@docvia/source` | Runtime collection helpers and Node markdown / IR-chunk loader. |
| `@docvia/plugin-vite` | In-process Vite plugin (`docvia()`) with virtual modules + HMR. |
| `@docvia/plugin-next` | Next.js wrapper (`withDocvia`) — webpack + Turbopack. |
| `@docvia/plugin-shiki` | Build-time syntax highlighting via Shiki (pluggable). |
| `@docvia/plugin-openapi` | Generate reference pages from an OpenAPI spec. |

## Apps

| App | Purpose |
|---|---|
| `apps/web` | Marketing/landing site (SvelteKit + Tailwind + shadcn-svelte). |
| `apps/docs` | Documentation site (SvelteKit + docvia). |
| `examples/demo-next` | End-to-end React/Next.js example. |
| `examples/demo-svelte` | End-to-end Svelte/SvelteKit example. |

## Development

```bash
pnpm install
pnpm build       # build all packages
pnpm test        # run vitest across packages
pnpm typecheck   # tsc --noEmit across packages
```

### Watch modes

`pnpm dev` is intentionally focused — it only watches `packages/*` and `apps/*`, not the heavier `examples/*` demos. Run those explicitly when you need them.

| Script | What it watches |
|---|---|
| `pnpm dev` | All packages + both apps (`apps/web`, `apps/docs`) |
| `pnpm dev:packages` | Only `packages/*` (compiler, CLI, renderers, …) |
| `pnpm dev:apps` | Only `apps/*` (landing + docs site) |
| `pnpm dev:web` | Only `apps/web` |
| `pnpm dev:docs` | Only `apps/docs` |
| `pnpm dev:examples` | Both example demos (`demo-next`, `demo-svelte`) |
| `pnpm dev:next` | Only `examples/demo-next` |
| `pnpm dev:svelte` | Only `examples/demo-svelte` |
| `pnpm dev:all` | Everything in the monorepo |

Each filtered script still rebuilds the packages it depends on (`turbo` resolves the dependency graph), so you can run `pnpm dev:next` without first running `pnpm dev:packages`.

Releases are managed with [Changesets](https://github.com/changesets/changesets) — see [RELEASING.md](./RELEASING.md) for the full workflow.

```bash
pnpm changeset           # author a changeset (run on every code-changing PR)
pnpm changeset:status    # see what's pending
pnpm version-packages    # consume changesets → bump versions, write CHANGELOGs
pnpm release             # pnpm build && changeset publish
```

CI handles version bumps and publishing automatically — see `.github/workflows/release.yml`.

## Status

v0.2 preview. APIs are stabilizing; expect breaking changes before v1.0. See
[`.changeset/`](./.changeset) for in-flight release notes, [MODES.md](./MODES.md)
for the build/dev/SSR breakdown, and [`documentation.md`](./documentation.md)
for architecture notes.

## License

MIT
