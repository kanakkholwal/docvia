# @docvia/renderer-react

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

- ee4878c: Code blocks get a copy button.
  
  - Every code block now carries `data-docvia-code` and ends with a `<button class="docvia-copy" data-docvia-copy>` (exported as `COPY_BUTTON_HTML`). Style or hide it with CSS.
  - `installCopyButtons()` from `@docvia/renderer-core/client` wires every button with one delegated listener: it copies the block's code and sets `data-copied` for 1.6 s. Svelte's `<Renderer>` and React's `hydrate()` call it for you; `@docvia/renderer-react/client` re-exports it.
  - React's `codeBlock` override still receives the highlighted HTML without the built-in button, so custom blocks keep their own controls.
  - The CLI's React template calls `installCopyButtons()` and its `docs.css` styles the button.
- c2f9544: fumadocs-style macro API and a lazy, cache-free pipeline.
  
  - `defineDocs()` and `defineRegistry()` from `@docvia/source/macro`, plus `loader()` from `@docvia/source` with fumadocs method names (`getPage`, `getPages`, `getPageTree`, `generateParams`, `getPageByHref`, `serializePageTree`). The same `lib/source.ts` works in Vite (SvelteKit, React, TanStack Start) and Next.js (webpack and Turbopack).
  - `page.data.load()` returns `{ content, toc, headings, manifest, structuredData }`; bodies compile on first request and stay lazy in SSR bundles (small Workers cold start).
  - `meta.json` page tree: `title`, `pages` (`...`, `---Separator---`, `!exclude`, `[Text](url)`), `defaultOpen`, `root`.
  - Breaking: no disk cache. `.docvia/cache.json`, `incremental` and the CLI `--no-cache` flag are gone; `.docvia/` is only written for legacy config collections.
  - Pages emit compile-time `structuredData`; `createFromSource` indexes it and accepts `loader()` sources.
  - Static subtrees render to HTML strings (`staticHtml` renderer option), roughly halving Svelte page payloads.
  - Shiki uses the WASM engine and loads languages on demand (`engine: "javascript"` opts out).

### Patch Changes

- Updated dependencies [ee4878c]
- Updated dependencies [c2f9544]
- Updated dependencies [c3350bb]
  - @docvia/renderer-core@2.0.0
  - @docvia/ir@2.0.0

## 0.2.3

### Patch Changes

- ca6b6c6: Fix the `hydrate()` JSDoc example, which imported an unresolvable per-page virtual
  module (`virtual:docvia/my-page`) and then also took the same `manifest` as a
  prop. The manifest comes off a page loaded on the server and is passed in — a
  client component must not import the collection, which eagerly pulls in every
  compiled page.
- Updated dependencies [ca6b6c6]
  - @docvia/ir@0.4.0
  - @docvia/renderer-core@0.2.3

## 0.2.2

### Patch Changes

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

- Updated dependencies [7e90aeb]
  - @docvia/ir@0.3.0
  - @docvia/renderer-core@0.2.2

## 0.2.1

### Patch Changes

- 55a3826: Renderers no longer bundle a syntax highlighter — highlighting is fully a build-time plugin.

  Syntax highlighting moved to `@docvia/plugin-shiki` (a docvia plugin that bakes highlighted HTML into the IR). The renderer adapters carried their own Shiki highlighter, which duplicated that responsibility and pulled `shiki` into the renderer dependency tree. That highlighter is now removed.

  - `@docvia/renderer-react` / `@docvia/renderer-svelte` — the `createShikiHighlighter` export is removed, and `createReactRenderer()` / `createSvelteRenderer()` no longer accept a `highlighter` option. The `shiki` dependency is dropped from both packages.
  - `@docvia/renderer-core` — `RenderContext.highlighter` is now optional. The `code-block` renderer emits a node's pre-highlighted `props.html` when present (set by a build-time plugin); when there is neither pre-highlighted HTML nor a render-time `highlighter`, it emits a plain `<pre><code>` block instead of throwing.
  - `@docvia/cli` — `docvia init` scaffolds a `docvia.config.ts` that registers the `shiki()` plugin in `plugins` instead of passing a `highlighter` to the renderer.

  Migration: drop `createShikiHighlighter` / the renderer `highlighter` option, and add `shiki()` from `@docvia/plugin-shiki` to your config's `plugins` array.

- Updated dependencies [55a3826]
  - @docvia/renderer-core@0.2.1

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
  - @docvia/renderer-core@0.2.0

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
  - @docvia/ir@0.1.0
  - @docvia/renderer-core@0.1.0
