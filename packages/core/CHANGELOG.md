# @docvia/core

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
- 11dfc48: React and Svelte share one renderer API: `Renderer` with `nodes`, `registry` and `components`.
  
  - `DocviaContent` from `@docvia/core/react` is now `Renderer`, the name Svelte already used. `DocviaContentProps` is `RendererProps` and `DocviaComponents` is `RendererComponents`.
  - The Svelte `Renderer` takes `components` too: tag overrides (`{ a: Link }`) and a `codeBlock` slot, with the same props as React.
  - `codeBlock` overrides now reach code blocks at any depth, such as inside lists; before, React only saw top-level ones and Svelte none.
  - The Svelte renderer keeps `a` and `img` as nodes, like React, so tag overrides work the same in both.
  - `staticHtml.keepTags` adds to the renderer's own kept tags instead of replacing them.
  - A missing directive component renders the same `docvia-render-error` placeholder in both.
  - `docvia init` templates use `Renderer`.

### Minor Changes

- f5ec52e: Absolute `http(s)` links in Markdown now open in a new tab with `rel="noopener noreferrer"`. Set `externalLinks: false` on `createReactRenderer()` or `createSvelteRenderer()` to keep plain links, or pass your own `target` and `rel`.

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
