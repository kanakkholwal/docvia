---
title: "Packages"
description: "Deep reference for every @docvia/* package — contracts, parsing, orchestration, rendering, runtime, and integration."
eyebrow: "Packages"
order: 3
---

docvia ships as a set of focused, single-purpose packages. This section is the
deep API reference for each one — every export, signature, and option. For
task-oriented walkthroughs, see the [Guides](/guide).

## Contracts

- [`@docvia/ir`](/packages/ir) — the Intermediate Representation, the shared
  error system, the compiler/renderer/plugin contracts, and the AST → IR
  transform.

## Parsing

- [`@docvia/core`](/packages/core) — the Markdown parsing pipeline
  (`unified` + `remark` + `rehype`).
- [`@docvia/schema`](/packages/schema) — frontmatter validation (Zod), YAML
  extraction, and TypeScript codegen.

## Orchestration

- [`@docvia/compiler`](/packages/compiler) — the parallel build orchestrator,
  content hashing, the incremental cache, and module-graph generation.
- [`@docvia/plugins`](/packages/plugins) — `defineConfig`, `loadConfig`, and
  the `PluginRunner`.

## Rendering

- [`@docvia/renderer-core`](/packages/renderer-core) — the framework-agnostic
  rendering engine and default node renderers.
- [`@docvia/renderer-react`](/packages/renderer-react) — the React adapter.
- [`@docvia/renderer-svelte`](/packages/renderer-svelte) — the Svelte adapter.

## Runtime

- [`@docvia/source`](/packages/source) — the runtime collection model and the
  Node Markdown loader.
- [`@docvia/search`](/packages/search) — section-level Orama indexing and the
  client search helper.

## Integration

- [`@docvia/cli`](/packages/cli) — the `docvia` command (`init`, `build`,
  `dev`, `preview`).
- [`@docvia/plugin-vite`](/packages/plugin-vite) — Vite plugins for the
  `docvia/source` and `*.md?docvia` virtual modules.
- [`@docvia/plugin-next`](/packages/plugin-next) — the Next.js `withDocvia`
  wrapper.
- [`@docvia/plugin-openapi`](/packages/plugin-openapi) — render OpenAPI 3.x
  endpoints inline in Markdown.
