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
import { docviaSource } from "docvia/source";

const page = await docviaSource.docs.get("index");
```

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

Releases are managed with [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset           # author a changeset
pnpm version-packages    # bump versions + write CHANGELOGs
pnpm release             # build + publish
```

## Status

v0.1 preview. APIs are stabilizing; expect breaking changes before v1.0. See
[`.changeset/`](./.changeset) for in-flight release notes and
[`documentation.md`](./documentation.md) for architecture notes.

## License

MIT
