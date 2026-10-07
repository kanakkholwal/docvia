# @docvia/plugin-openapi

## 2.0.0

### Major Changes

- c3350bb: Production hardening from the baby-ui field report. Breaking:
  
  - `docvia()` is the only Vite plugin; `docviaSourcePlugin` and `docviaMarkdownPlugin` are removed. `docvia()` with no arguments loads `docvia.config.*`.
  - `registry` moved from `virtual:docvia/source` to `virtual:docvia/registry` (`docvia/registry` on Next.js), which always exists.
  - Generated files live in `.docvia/`: `docvia-env.d.ts` is now `.docvia/env.d.ts` and `dynamic.ts` is gone. Add `".docvia/*.d.ts"` to tsconfig `include`. Apps must depend on `@docvia/source` directly.
  - `outDir` and component paths resolve from the project root, not `process.cwd()`. Missing component files fail the build.
  - Packages ship ESM `.js` with an `exports` map (incl. `./package.json`). `@docvia/renderer-svelte` takes `svelte` as a peer.
  - Renderers lose `docviaVitePlugin`, `createInMemoryStore` and `invalidateModules`.
  - `@docvia/schema` drops Zod; `DocPageSchema` is a Standard Schema.
  
  New: `docvia sync`, per-collection `frontmatter`, `optional` collections, `hashExclude`, component globs, fence `title`/`tab`, code groups, npm tabs, renderer `transform` hook, search `records` and result `url`, `defineConfig` from `@docvia/plugin-vite` and `@docvia/plugin-next`.
  
  Fixed: HMR for collections outside the Vite root, renames and deletes in every Vite environment, Windows path casing, and dev pages missing plugin output (e.g. highlighting). Packages are MIT with a LICENSE file each.

### Patch Changes

- Updated dependencies [c2f9544]
- Updated dependencies [c3350bb]
  - @docvia/ir@2.0.0

## 0.2.2

### Patch Changes

- Updated dependencies [ca6b6c6]
  - @docvia/ir@0.4.0

## 0.2.1

### Patch Changes

- Updated dependencies [7e90aeb]
  - @docvia/ir@0.3.0

## 0.2.0

### Minor Changes

- b3a61dc: Runtime + SSR architecture: docvia now runs in three modes from one shared compile core.

  Previously docvia was a build-time-only compiler — `compile()` was batch, stateless, and disk-based, with three divergent render pipelines. This release extracts a stateful compile core and unifies build, dev, and request-time rendering onto it.

  **New packages**

  - `@docvia/runtime` — a long-lived `CompileService` that owns the resolved config, plugin runner, incremental cache, and module graph. Exposes `compileAll()`, incremental `invalidate()`, `getDocument()`, and module-graph / IR-chunk emitters. Build, dev, and SSR all drive this one service, so their output is identical.
  - `@docvia/ssr` — request-time rendering. `createDocviaSSR()` renders a single document on demand with an in-memory LRU keyed by content hash. `FsContentProvider` (`@docvia/ssr/node`) for Node; `BundledContentProvider` + `createGlobChunkLoader()` for edge runtimes (Cloudflare Workers) — no `node:fs`, no markdown parsing at request time.
  - `@docvia/plugin-shiki` — syntax highlighting is now a pluggable build-time plugin. It highlights code blocks during compilation and bakes the HTML into the IR, so no highlighter ships to the browser or edge bundle. Any highlighter can be wired the same way.

  **Changes**

  - `@docvia/compiler` — `compile()` is now a thin wrapper over `CompileService` (behaviour-identical).
  - `@docvia/plugin-vite` — new `docvia()` plugin runs the `CompileService` in-process: no separate `docvia build` step, a virtual `docvia/source` module in dev, and incremental HMR via `service.invalidate()`. The legacy `docviaSourcePlugin()` / `docviaMarkdownPlugin()` exports remain for back-compat.
  - `@docvia/plugin-next` — `withDocvia` now drives `CompileService` with incremental dev recompilation, and adds `turbopack.resolveAlias` so docs resolve under Turbopack as well as webpack.
  - `@docvia/cli` — `docvia dev` runs on a single long-lived `CompileService` with incremental `invalidate()` instead of a full recompile per change.
  - `@docvia/source` — adds `loadIRChunk()`, which renders a pre-built per-route IR chunk (all plugins already applied) — the consistent server-render path for bundlers without a `?docvia` transform.
  - `@docvia/renderer-core` — the `code-block` renderer prefers build-time pre-highlighted HTML, so no render-time highlighter is needed when a highlighter plugin is used.

  See `MODES.md` for the build / dev / SSR breakdown.

### Patch Changes

- Updated dependencies [b3a61dc]
  - @docvia/ir@0.2.0
