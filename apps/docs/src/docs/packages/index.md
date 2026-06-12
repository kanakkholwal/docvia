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

## Compile core

- [`@docvia/runtime`](/packages/runtime) — `CompileService`, the stateful
  compile core shared by build, dev, and SSR.
- [`@docvia/compiler`](/packages/compiler) — the batch build entry (`compile()`),
  content hashing, the incremental cache, and module-graph generation.
- [`@docvia/plugins`](/packages/plugins) — `defineConfig`, `loadConfig`, and
  the `PluginRunner`.

## Rendering

- [`@docvia/renderer-core`](/packages/renderer-core) — the framework-agnostic
  rendering engine and default node renderers.
- [`@docvia/renderer-react`](/packages/renderer-react) — the React adapter.
- [`@docvia/renderer-svelte`](/packages/renderer-svelte) — the Svelte adapter.

## Runtime

- [`@docvia/source`](/packages/source) — the runtime collection model
  (`createCollection` / `createSource`) the generated `source.ts` is built on.
- [`@docvia/ssr`](/packages/ssr) — request-time rendering for Node and edge
  runtimes.
- [`@docvia/search`](/packages/search) — section-level Orama indexing and the
  client search helper.

## Integration

- [`@docvia/cli`](/packages/cli) — the `docvia` command (`init`, `build`,
  `dev`, `preview`).
- [`@docvia/plugin-vite`](/packages/plugin-vite) — the in-process `docvia()`
  Vite plugin, with virtual modules and incremental HMR.
- [`@docvia/plugin-next`](/packages/plugin-next) — the Next.js `withDocvia`
  wrapper (webpack and Turbopack).
- [`@docvia/plugin-shiki`](/packages/plugin-shiki) — build-time syntax
  highlighting via Shiki.
- [`@docvia/plugin-openapi`](/packages/plugin-openapi) — render OpenAPI 3.x
  endpoints inline in Markdown.
