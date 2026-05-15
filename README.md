# docvia

A build-time documentation compiler. docvia turns a directory of Markdown into
typed, pre-rendered modules for React, Svelte, or any framework with a renderer
adapter — no runtime Markdown parser ships to the browser.

- **Build-time first.** Markdown is parsed, sanitized, and transformed into an
  Intermediate Representation (IR) once.
- **Typed frontmatter.** Extend the built-in schema with a Zod object and
  docvia generates a `Frontmatter` interface for every collection.
- **Incremental builds.** A `.docvia.cache.json` skips unchanged files between
  runs. Subsequent builds for unchanged content take milliseconds.
- **Pluggable pipeline.** Five hook points (`beforeParse`, `afterParse`,
  `beforeTransform`, `afterTransform`, `beforeRender`).
- **Framework adapters.** First-party React and Svelte renderers; Vite plugin
  and Next.js wrapper for direct integration.

## Install

```bash
pnpm add -D @docvia/cli
pnpm add @docvia/renderer-react   # or @docvia/renderer-svelte
```

## Quick start

```bash
npx docvia init                  # scaffold docs/ + docvia.config.ts
npx docvia build                 # compile to .docvia/
npx docvia dev                   # watch & rebuild on change
```

Minimal `docvia.config.ts`:

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

After `docvia build`, import the generated source:

```ts
import { docs } from "docvia/source"; // generated into .docvia/

const page = await docs.getPage(["getting-started"]); // slug segments
const all = docs.getPages();                          // metadata for every page
const tree = docs.pageTree;                           // navigation tree
```

## Framework integration

`docvia build` only produces a typed module graph in `.docvia/` — it does not
run a server. To render docs inside a real app, pair the build step with one of
the framework integrations. The pattern is always the same: run `docvia build`
before the framework dev/build, then import from `docvia/source`.

### SvelteKit (Vite)

```bash
pnpm add -D @docvia/cli @docvia/plugin-vite
pnpm add @docvia/renderer-svelte @docvia/source @docvia/compiler @docvia/renderer-core
```

```ts
// vite.config.ts
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [sveltekit(), docviaSourcePlugin(), docviaMarkdownPlugin(docviaConfig)],
  build: {
    rollupOptions: {
      external: ["@docvia/source", "@docvia/source/internal"],
    },
  },
});
```

```jsonc
// package.json — build docs before Vite starts
{
  "scripts": {
    "predev": "docvia build",
    "dev": "vite dev",
    "prebuild": "docvia build",
    "build": "vite build"
  }
}
```

The `docvia.config.ts` must use the Svelte renderer (`createSvelteRenderer`
from `@docvia/renderer-svelte/node`). Consume pages in a catch-all route via
`docs.getPage(...)` and render them with the `Renderer` component from
`@docvia/renderer-svelte`. See [`examples/demo-svelte`](./examples/demo-svelte)
and [`apps/docs`](./apps/docs) for working setups.

### Next.js

```bash
pnpm add -D @docvia/cli @docvia/plugin-next
pnpm add @docvia/renderer-react @docvia/source react react-dom
```

```js
// next.config.mjs
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia({ configPath: "./docvia.config.ts" })({
  reactStrictMode: true,
});
```

`withDocvia` compiles the docs when the Next config is evaluated, aliases
`docvia/source` to the compiled output, and starts an incremental watcher in
dev. See [`examples/demo-next`](./examples/demo-next).

### Standalone preview

`docvia preview` serves `.docvia/` over `sirv` — a sanity check for the compiled
output only. It is not a runtime; use a framework integration for a real site.

## Packages

| Package | Purpose |
|---|---|
| `@docvia/cli` | `init` / `build` / `dev` / `preview` commands. |
| `@docvia/compiler` | Build orchestrator, content hashing, incremental cache, module-graph generation. |
| `@docvia/core` | Markdown parsing pipeline (`unified` + `remark` + `rehype`). |
| `@docvia/ir` | Intermediate representation, error system, AST → IR transform. |
| `@docvia/schema` | Frontmatter validation (Zod), YAML extraction, TS codegen. |
| `@docvia/plugins` | `defineConfig`, `loadConfig`, `PluginRunner`. |
| `@docvia/renderer-core` | Framework-agnostic rendering engine and default renderers. |
| `@docvia/renderer-react` | React renderer adapter (server + `./client` hydration). |
| `@docvia/renderer-svelte` | Svelte renderer adapter. |
| `@docvia/search` | Section-level Orama indexing and client search helper. |
| `@docvia/source` | Runtime collection helpers and Node markdown loader. |
| `@docvia/plugin-vite` | Vite plugin for `?docvia` virtual modules. |
| `@docvia/plugin-next` | Next.js wrapper (`withDocvia`). |

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

v0.1 preview. APIs are stabilizing; expect breaking changes before v1.0. See
[`.changeset/`](./.changeset) for in-flight release notes and
[`documentation.md`](./documentation.md) for architecture notes.

## License

MIT
