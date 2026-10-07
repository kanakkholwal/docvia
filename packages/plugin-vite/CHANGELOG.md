# @docvia/plugin-vite

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

### Minor Changes

- c2f9544: fumadocs-style macro API and a lazy, cache-free pipeline.
  
  - `defineDocs()` and `defineRegistry()` from `@docvia/source/macro`, plus `loader()` from `@docvia/source` with fumadocs method names (`getPage`, `getPages`, `getPageTree`, `generateParams`, `getPageByHref`, `serializePageTree`). The same `lib/source.ts` works in Vite (SvelteKit, React, TanStack Start) and Next.js (webpack and Turbopack).
  - `page.data.load()` returns `{ content, toc, headings, manifest, structuredData }`; bodies compile on first request and stay lazy in SSR bundles (small Workers cold start).
  - `meta.json` page tree: `title`, `pages` (`...`, `---Separator---`, `!exclude`, `[Text](url)`), `defaultOpen`, `root`.
  - Breaking: no disk cache. `.docvia/cache.json`, `incremental` and the CLI `--no-cache` flag are gone; `.docvia/` is only written for legacy config collections.
  - Pages emit compile-time `structuredData`; `createFromSource` indexes it and accepts `loader()` sources.
  - Static subtrees render to HTML strings (`staticHtml` renderer option), roughly halving Svelte page payloads.
  - Shiki uses the WASM engine and loads languages on demand (`engine: "javascript"` opts out).
- c2f9544: `docvia init` adds docs to an existing app, and `docvia.config.ts` is optional.
  
  - `docvia init [dir]` detects Next.js, SvelteKit or TanStack Start, the package manager (lockfile, `packageManager`, user agent) and the app's import aliases. It writes `content/docs`, `lib/source.ts`, docs routes with sidebar and table of contents, a `/api/search` route and starter CSS, adds `docvia()` or `withDocvia()` to the bundler config, excludes `content/` from Tailwind v4 scanning, and installs the packages. New flags: `--yes`, `--no-install`, `--framework`. Breaking: `--renderer` and `--dir` are gone (pass the directory as an argument).
  - Without a config file, the renderer is picked from the app's dependencies (Svelte or React) and Shiki is enabled when `@docvia/plugin-shiki` is installed. A config file that omits `renderer` gets the same detection.
  - `docvia()` (Vite) and `withDocvia()` (Next.js) no longer require `docvia.config.ts`.
  - `DOCVIA_TARBALLS=<dir>` makes `docvia init` install packed tarballs, for trying unreleased builds.
  - `@docvia/plugin-mermaid`: fix a type error under `noUncheckedIndexedAccess`.

### Patch Changes

- d805bf3: Editing a page body in dev swaps just that page on the server instead of reloading every server module.
  
  - Fixes `Cannot read properties of null (reading 'function')` thrown by SvelteKit layouts after each content edit: the full SSR program reload re-ran Svelte's runtime under the running app.
  - Compiled pages accept their own hot updates in dev, and `page.data.load()` caches by module rather than by path, so the server serves the new body at once. The browser reloads to show it.
  - A visible edit in a fresh SvelteKit app drops from about 250 ms to 56 ms.
- Updated dependencies [d805bf3]
- Updated dependencies [c2f9544]
- Updated dependencies [d805bf3]
- Updated dependencies [c3350bb]
- Updated dependencies [c2f9544]
  - @docvia/source@2.0.0
  - @docvia/ir@2.0.0
  - @docvia/runtime@2.0.0
  - @docvia/plugins@2.0.0

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
  - @docvia/schema@0.4.0
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
  - @docvia/schema@0.3.0
  - @docvia/ir@0.3.0
  - @docvia/plugins@0.3.0
  - @docvia/runtime@0.4.0
  - @docvia/source@0.3.1

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
  - @docvia/source@0.3.0

## 0.2.1

### Patch Changes

- @docvia/source@0.2.1

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
  - @docvia/runtime@0.2.0
  - @docvia/schema@0.2.0
  - @docvia/source@0.2.0

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
  - @docvia/core@0.1.0
  - @docvia/ir@0.1.0
  - @docvia/schema@0.1.0
  - @docvia/source@0.1.0
