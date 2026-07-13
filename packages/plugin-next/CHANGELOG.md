# @docvia/plugin-next

## 1.0.0

### Major Changes

- ca6b6c6: **Breaking:** `@docvia/source` is now a peer dependency

  The generated module graph (`.docvia/source.ts` and the virtual source module)
  imports `@docvia/source/internal`, so the package has to be resolvable from the
  **consuming app** — not from the plugin. It was a plain dependency of
  `@docvia/plugin-vite`, and `@docvia/plugin-next` / `@docvia/cli` did not declare
  it at all. Under pnpm's strict linking the generated import is unresolvable, so
  the app's build breaks outright rather than merely failing to type-check.

  It is now a `peerDependency` of all three, which makes the requirement explicit
  and installs it where the generated code actually needs it.

  **Migration.** If your package manager does not install peers automatically, add
  `@docvia/source` to your app's dependencies:

  ```bash
  pnpm add @docvia/source
  ```

  Projects that already worked around this by depending on `@docvia/source`
  directly need no change.

### Patch Changes

- Updated dependencies [ca6b6c6]
- Updated dependencies [ca6b6c6]
  - @docvia/ir@0.4.0
  - @docvia/runtime@0.5.0
  - @docvia/source@0.4.0
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
  - @docvia/ir@0.3.0
  - @docvia/plugins@0.3.0
  - @docvia/runtime@0.4.0

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

### Patch Changes

- Updated dependencies [6adfee1]
  - @docvia/runtime@0.3.0

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
  - @docvia/plugins@0.2.0
  - @docvia/runtime@0.2.0

## 0.1.0

### Minor Changes

- 371b0f6: # v0.1 — Public preview

  First public preview of docvia. APIs are stabilizing; expect breaking changes
  before v1.0.

  ### Added

  - **Incremental builds.** The compiler now persists `.docvia.cache.json` and
    skips files whose content hash and pipeline cache key are unchanged.
    `CompileResult.stats.cached` now reflects real numbers.
  - **`compile()` accepts `projectRoot` and `incremental`.** `projectRoot`
    controls where `docvia-env.d.ts` is emitted (no longer assumes
    `process.cwd()`). `incremental: false` forces a full rebuild.
  - **`docvia init --renderer react|svelte|none`.** The scaffold now produces a
    config that builds without further edits and autodetects the renderer from
    `package.json` when omitted. `--force` overwrites an existing config.
  - **`docvia dev` hardening.** Build lock prevents concurrent rebuilds racing
    on `dynamic.ts` writes; the config file is watched alongside the source
    directory; `SIGINT`/`SIGTERM` close the watcher cleanly. Rebuild logs now
    show the changed-file count.
  - **`docvia build --no-cache`.** Disables the incremental cache for one run.
  - **Plugin error context.** Errors thrown from plugin hooks are wrapped in a
    `docviaError` carrying the plugin's name, version, and hook name.
  - **Stable config hashing.** Config hash is computed from a sorted-key JSON
    serialization, so cosmetic key reordering no longer invalidates the cache.
  - **`loadConfig` validation.** Throws a clear `CONFIG_ERROR` when the config
    file does not export an object.
  - **Parallelized file discovery.** `readFileTree` now reads directories and
    files in parallel batches.
  - **`defineConfig` passes through `collections`.** Previously the
    user-supplied `collections` array was silently dropped.

  ### Changed

  - **`@docvia/cli` no longer depends on `@docvia/renderer-svelte`.** Renderers
    are installed by the consumer (`@docvia/renderer-react` or
    `@docvia/renderer-svelte`).
  - **CLI entry detection** uses a real-path comparison of `process.argv[1]`
    against `import.meta.url`, instead of substring matching.
  - **`docvia preview`** now prints a one-time notice clarifying that it serves
    the raw `.docvia/` output and is not a standalone runtime.

  ### Fixed

  - `defineConfig` previously dropped the `collections` field.
  - `docvia-env.d.ts` was written to `process.cwd()` regardless of where the
    config lived; it now resolves relative to the config's directory.
  - The destructive `postinstall: pnpm run reset` script has been removed from
    the workspace root.

  ### Known limitations

  - Only `syntax.highlighter: "shiki"` is implemented; `"prism"` is reserved.
  - `dependencyHashes` is still empty in `computeContentHash` — cross-file
    dependency tracking is planned for v0.2.
  - Frontmatter extension schemas use `passthrough()`; unknown keys are not
    rejected.

### Patch Changes

- Updated dependencies [371b0f6]
  - @docvia/compiler@0.1.0
  - @docvia/ir@0.1.0
  - @docvia/plugins@0.1.0
