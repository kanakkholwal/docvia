---
title: "Packages"
description: "Deep reference for every @docvia/* package: contracts, parsing, orchestration, rendering, runtime, and integration."
eyebrow: "Packages"
order: 3
---

docvia ships as a set of focused, single-purpose packages. This section is the
deep API reference for each one: every export, signature, and option. For
task-oriented walkthroughs, see the [Guides](/docs/guide).

## Contracts

- [`@docvia/ir`](/docs/packages/ir) is the Intermediate Representation, the
  shared error system, the compiler/renderer/plugin contracts, and the AST → IR
  transform.

## Parsing

- [`@docvia/core`](/docs/packages/core) is the Markdown parsing pipeline
  (`unified` + `remark` + `rehype`).
- [`@docvia/schema`](/docs/packages/schema) handles frontmatter validation
  (Zod), YAML extraction, and TypeScript codegen.

## Compile core

- [`@docvia/runtime`](/docs/packages/runtime) holds `CompileService`, the
  stateful compile core shared by build, dev, and SSR.
- [`@docvia/compiler`](/docs/packages/compiler) is the batch build entry
  (`compile()`), content hashing, the incremental cache, and module-graph
  generation.
- [`@docvia/plugins`](/docs/packages/plugins) provides `defineConfig`,
  `loadConfig`, and the `PluginRunner`.

## Rendering

- [`@docvia/renderer-core`](/docs/packages/renderer-core) is the
  framework-agnostic rendering engine and default node renderers.
- [`@docvia/renderer-react`](/docs/packages/renderer-react) is the React adapter.
- [`@docvia/renderer-svelte`](/docs/packages/renderer-svelte) is the Svelte adapter.

## Runtime

- [`@docvia/source`](/docs/packages/source) is the runtime collection model
  (`createCollection` / `createSource`) the generated `source.ts` is built on.
- [`@docvia/ssr`](/docs/packages/ssr) does request-time rendering for Node and
  edge runtimes.
- [`@docvia/search`](/docs/packages/search) provides section-level Orama indexing
  and the client search helper.

## Integration

- [`@docvia/cli`](/docs/packages/cli) is the `docvia` command (`init`, `build`,
  `dev`, `preview`).
- [`@docvia/plugin-vite`](/docs/packages/plugin-vite) is the in-process
  `docvia()` Vite plugin, with virtual modules and incremental HMR.
- [`@docvia/plugin-next`](/docs/packages/plugin-next) is the Next.js `withDocvia`
  wrapper (webpack and Turbopack).
- [`@docvia/plugin-shiki`](/docs/packages/plugin-shiki) does build-time syntax
  highlighting via Shiki.
- [`@docvia/plugin-mermaid`](/docs/packages/plugin-mermaid) turns Mermaid fences
  into diagram components.
- [`@docvia/plugin-openapi`](/docs/packages/plugin-openapi) renders OpenAPI 3.x
  endpoints inline in Markdown.
