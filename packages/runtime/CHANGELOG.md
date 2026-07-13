# @docvia/runtime

## 0.5.0

### Minor Changes

- ca6b6c6: Custom frontmatter now reaches the runtime, and the generated types no longer lie about it

  `toPageMeta` hard-coded eight built-in keys and dropped everything else, so fields
  validated by a configured `frontmatter` schema were thrown away before they ever
  reached a page module. `getPage().data` had no custom fields while the generated
  types insisted it did — which made the `frontmatter` option effectively
  non-functional, and made TypeScript confirm a shape the runtime never produced.

  - `toPageMeta` now spreads `ir.frontmatter` before applying derived fields, so
    every validated key survives to `meta`. Derived fields (`slug`, `contentHash`,
    `headings`) still win over same-named frontmatter keys.
  - `PageMeta` gains an index signature and an explicit `draft`. The built-in
    `draft` flag was validated on every file and then consumed by nothing; it is
    now readable, so pages can be filtered on it.
  - Generated frontmatter types are wrapped in a new `Jsonify<T>` projection.
    Page `meta` is emitted through `JSON.stringify`, so a schema that coerces to
    `Date` hands the reader back an ISO **string**. The emitted type now says
    `string` too, and calling `.getTime()` on it fails at compile time rather than
    at runtime.

  `@docvia/schema` exports `JSONIFY_TYPE_NAME` / `JSONIFY_TYPE_DECL`, and
  `composeFrontmatterType` now wraps its result in that projection.

  If your schema coerces to a non-JSON type (`Date` being the common one), the
  generated type for that field changes from `Date` to `string`. That is what the
  value has always been at runtime; the type was previously wrong.

### Patch Changes

- Updated dependencies [ca6b6c6]
  - @docvia/ir@0.4.0
  - @docvia/schema@0.4.0
  - @docvia/plugins@0.3.1

## 0.4.0

### Minor Changes

- 7e90aeb: Standard Schema frontmatter validation, precise type inference, and unified internals

  Frontmatter validation is now **validation-library agnostic** via the
  [Standard Schema](https://standardschema.dev) spec. Pass any compliant schema —
  Zod, Valibot, ArkType, … — as `frontmatter` in your config, not just Zod:

  ```ts
  import * as v from "valibot";
  export default defineConfig({
    frontmatter: v.object({ author: v.optional(v.string()) }),
  });
  ```

  - **Precise generated types for any library.** The generated `Frontmatter` type
    is inferred from the schema's compile-time `~standard.types` output, so it
    stays exact whatever library you use — with no runtime introspection. The base
    fields, the inference formula, and the composition now live in `@docvia/schema`
    (`BASE_FRONTMATTER_TYPE`, `inferSchemaOutput`, `composeFrontmatterType`).
  - **Zero-config type inference.** `defineConfig` is generic and preserves your
    schema's concrete type, and every entry point auto-detects `docvia.config.*`
    across `.ts/.mts/.cts/.js/.mjs/.cjs`. In the Vite plugin, pass `{ configPath }`
    to point elsewhere or `{ configPath: false }` to opt out.
  - **New public APIs.** `@docvia/plugins`: `resolveProject`, `resolveConfigPath`,
    `CONFIG_BASENAMES`. `@docvia/ir`: `toPageMeta`, `InferFrontmatter`,
    `FrontmatterSchema`, and `configPath` on `CompilerOptions`.

  Internals were consolidated behind these features with no behavior change
  (generated `.docvia` output is byte-identical): build, dev, and every bundler
  loader now share one markdown→IR pipeline (`markdownToIR`); config discovery +
  load + project-root derivation flow through one resolver (`resolveProject`); the
  frontmatter→`PageMeta` mapping is owned by `toPageMeta`; and the disk
  `source.ts`/`browser.ts` emitters share their collection bindings.

  Note: `@docvia/schema` no longer exports the Zod-specific `zodSchemaToFrontmatterTs`
  type-codegen helper — frontmatter types are now derived from the schema's
  Standard Schema output type instead of Zod introspection.

### Patch Changes

- Updated dependencies [7e90aeb]
  - @docvia/schema@0.3.0
  - @docvia/ir@0.3.0
  - @docvia/plugins@0.3.0

## 0.3.0

### Minor Changes

- 6adfee1: Load markdown in place as modules — drop the per-route IR JSON

  docvia now compiles each markdown file **in place** through a `?docvia` loader
  instead of emitting a per-route IR JSON store. The generated `.docvia/` is just
  thin glue that imports the markdown modules; the host bundler (Vite, webpack,
  Turbopack) compiles, code-splits, and bundles them. Content lives once in the
  `.md`, so builds stay small and scale to thousands of pages, and SSR works on
  the edge with no filesystem access.

  **New**

  - `docvia/source/browser` — a lazy, code-split client entry (each page is
    `() => import("…?docvia")`), alongside the eager `docvia/source` used for SSR.
  - `@docvia/plugin-next` ships a real webpack + Turbopack `?docvia` loader, so
    Next.js compiles markdown in place too — no IR JSON fallback.
  - `@docvia/runtime` exports `compileMarkdownToModule`, the shared,
    bundler-agnostic transform every loader calls.
  - `createDocviaSSR({ provider })` now accepts a `ContentProvider`, a live
    `CompileService` (pass it directly), or a `(collection, slug) => IR` function.
  - `@docvia/runtime`'s `CompileService` gains `getDocuments(collection?)` — the
    full IR for every compiled page (recompiling cache-only entries on demand).

  **Breaking**

  - The Vite plugin now follows the Vite virtual-module convention: import from
    `virtual:docvia/source` (and `virtual:docvia/source/browser`) instead of the
    bare `docvia/source`. Next.js keeps the `docvia/source` alias.
  - `.docvia/ir/**/*.json` chunks are no longer emitted.
  - Removed `@docvia/source/node` (`loadIRChunk`, `loadMarkdown`).
  - Removed `@docvia/ssr`'s `BundledContentProvider` and `createGlobChunkLoader`,
    and the `@docvia/ssr/node` entry (`FsContentProvider`). Pass a `CompileService`
    straight to `createDocviaSSR` instead.
  - `@docvia/search/node` no longer reads `<outDir>/ir/` (those chunks are gone).
    `buildSearchIndex` / `loadIRDocuments` now compile the docs in-process, so the
    `outDir` option is replaced by `configPath` (defaults to `docvia.config.ts`).

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
  - @docvia/core@0.2.0
  - @docvia/ir@0.2.0
  - @docvia/plugins@0.2.0
  - @docvia/schema@0.2.0
