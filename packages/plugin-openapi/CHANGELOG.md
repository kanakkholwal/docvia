# @docvia/plugin-openapi

## 3.0.0

### Major Changes

- 11dfc48: docvia is now seven packages instead of eighteen.
  
  - `@docvia/core` holds everything that runs where docs are served, with no Node APIs, so it runs on Cloudflare Workers and in browsers. It absorbs `@docvia/ir`, `@docvia/schema`, the plugin API from `@docvia/plugins`, `@docvia/renderer-core`, `@docvia/source`, `@docvia/ssr`, `@docvia/renderer-react` and `@docvia/renderer-svelte` as subpaths. React and Svelte are optional peers.
  - `@docvia/build` holds the Node build tooling: `@docvia/runtime`, `@docvia/compiler`, config loading from `@docvia/plugins`, `@docvia/plugin-vite` (now `@docvia/build/vite`) and `@docvia/plugin-next` (now `@docvia/build/next`). `@docvia/core` is its peer dependency.
  - `markdownToIR`, the pipeline every mode shares, is now exported from `@docvia/core/markdown`.
  - `docvia init` installs `@docvia/core` and `@docvia/search`, plus `@docvia/build` and `@docvia/plugin-shiki` as dev dependencies.
  
  Imports move like this:
  
  | Before | After |
  |---|---|
  | `@docvia/ir`, `@docvia/plugins` (`defineConfig`, `PluginRunner`) | `@docvia/core` |
  | `@docvia/core` (`parseMarkdown`) | `@docvia/core/markdown` |
  | `@docvia/schema` | `@docvia/core/schema` |
  | `@docvia/renderer-core` | `@docvia/core/render` |
  | `@docvia/source`, `@docvia/source/macro` | `@docvia/core/source`, `@docvia/core/source/macro` |
  | `@docvia/ssr` | `@docvia/core/ssr` |
  | `@docvia/renderer-react`, `@docvia/renderer-svelte` | `@docvia/core/react`, `@docvia/core/svelte` |
  | `@docvia/renderer-svelte/node` | `@docvia/core/svelte/node` |
  | `@docvia/runtime`, `@docvia/compiler`, `@docvia/plugins` (`loadConfig`, `resolveProject`) | `@docvia/build` |
  | `@docvia/plugin-vite` | `@docvia/build/vite` |
  | `@docvia/plugin-next` | `@docvia/build/next` |

### Minor Changes

- 11dfc48: Generate API reference pages from an OpenAPI spec.
  
  - `openapiModule()` (`@docvia/plugin-openapi/vite`) builds the spec at build time into `virtual:docvia/openapi`: an index, plus one lazy chunk per operation.
  - `openapiSource()` (`@docvia/plugin-openapi/source`) turns that into `loader()` pages: an overview and one page per operation, grouped by tag, with headings, a table of contents and search text. Pages render through `APIOperation` and `APIOverview` components you register.
  - `buildApiDocument()` resolves the spec into a render-ready model: `$ref`s followed with schema names kept, cycles marked, `allOf` merged, Markdown rendered, examples generated, and code samples (cURL, JavaScript, Python, Go) from Scalar's `snippetz`.
  - Request helpers in `./source` (`buildRequestUrl`, `buildRequestHeaders`, `defaultServer`, `missingParameters`, ...) for a framework-agnostic "Try it" playground; parameters carry their spec `example`.
  - `createProxyHandler()` (`@docvia/plugin-openapi/proxy`): a same-origin proxy limited to the spec's servers, refusing private hosts, never passing cookies, with size and time limits. `sendRequest()` and `routeRequest()` route each playground request through it only when needed.
  - Specs are parsed with Scalar's parser, so Swagger 2.0 and OpenAPI 3.0 and 3.1 all work; `js-yaml` is gone. Inline ` ```openapi` blocks now follow `$ref` request bodies and responses.

### Patch Changes

- Updated dependencies [11dfc48]
- Updated dependencies [f5ec52e]
- Updated dependencies [11dfc48]
  - @docvia/core@3.0.0

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
