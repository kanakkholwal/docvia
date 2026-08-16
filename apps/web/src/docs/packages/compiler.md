---
title: "@docvia/compiler"
description: "The parallel build orchestrator that walks the source tree, runs the pipeline, and emits the typed module graph."
eyebrow: "Packages"
order: 13
---

`@docvia/compiler` is the batch build entry point of docvia. It walks a source tree of markdown files, runs each one through the full pipeline — plugin hooks, parsing (`@docvia/core`), frontmatter validation (`@docvia/schema`), the AST to IR transform (`@docvia/ir`) — and emits a **module graph**: a small set of generated `.ts`/`.d.ts` files that frameworks like Vite and Next.js consume to load documentation pages.

> `compile()` is a thin wrapper over the [`CompileService`](/docs/packages/runtime) in `@docvia/runtime` — it constructs the service, runs `compileAll()`, and emits the disk module graph. The same service backs the dev server and SSR, so all three modes share one render path. See [Architecture](/docs/guide/architecture).

Two things make the compiler fast. First, it processes files **in parallel** across a worker pool. Second, it is **incremental**: it persists a `.docvia.cache.json` file in the output directory and skips any file whose content hash and pipeline cache key match the previous run.

The package depends on `@docvia/core`, `@docvia/ir`, `@docvia/plugins`, `@docvia/schema`, and [`@node-rs/xxhash`](https://github.com/napi-rs/node-rs) for fast content hashing.

## Installation

```bash
pnpm add @docvia/compiler
```

Requires Node.js `>=20.0.0`. ESM only.

## Exports

`@docvia/compiler` exposes a single entry point.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.mjs` | `compile`, `computeContentHash` (and its alias `hashContent`), the `HashInputs` type, plus the cache API: `readCache`, `writeCache`, `cacheIsCompatible`, `CACHE_FILE`, `CACHE_VERSION`, and the `CachedEntry` / `CacheFile` types. |

```ts
import { compile, computeContentHash } from "@docvia/compiler";
import type { CompilerOptions, CompileResult } from "@docvia/ir";
```

## Hashing

The compiler hashes content with xxh64 from `@node-rs/xxhash` and encodes digests in base-36 for compactness. Three kinds of hashes are computed: a per-file content hash, a deterministic config hash, and a composite document hash.

### `HashInputs`

```ts
interface HashInputs {
  readonly fileContent: string;
  readonly frontmatter: string;
  readonly configHash: string;
  readonly pluginCacheKeys: string[];
  readonly dependencyHashes: string[];
}
```

| Field | Type | Description |
| --- | --- | --- |
| `fileContent` | `string` | The file's own content hash. |
| `frontmatter` | `string` | A stable stringification of the validated frontmatter. |
| `configHash` | `string` | The deterministic hash of the resolved config. |
| `pluginCacheKeys` | `string[]` | One cache key per active plugin. |
| `dependencyHashes` | `string[]` | Content hashes of the document's dependencies. |

### `computeContentHash`

```ts
function computeContentHash(inputs: HashInputs): string
```

Joins all `HashInputs` fields with a `NUL` separator and returns the base-36 xxh64 digest of the result. This composite hash changes whenever the file, its frontmatter, the config, any plugin, or any dependency changes — making it a reliable cache key for a single document. Re-exported under the alias **`hashContent`**.

The config hash itself is produced internally by a stable JSON stringifier that sorts object keys (so declaration order does not matter) and skips function values (plugins are accounted for separately, via `pluginCacheKeys`).

## The `compile` function

### `compile`

```ts
function compile(options: CompilerOptions): Promise<CompileResult>
```

Runs a full or incremental build. Both `CompilerOptions` and `CompileResult` are defined in `@docvia/ir`.

Defaults applied to `CompilerOptions`:

| Option | Default | Notes |
| --- | --- | --- |
| `projectRoot` | `process.cwd()` | Root for resolving relative paths and emitting `docvia-env.d.ts`. |
| `incremental` | `true` | Pass `false` to force a full rebuild. |
| `config.collections` | `[{ name: "docs", sourceDir, baseUrl: "/" }]` | A single default collection when none are configured. |

The build proceeds as follows:

1. **Validate config** — warns about non-string or duplicate entries in `syntax.langs`.
2. **Resolve collections** — uses `config.collections`, or a single default `docs` collection.
3. **Prepare plugins and hashes** — constructs a `PluginRunner`, computes the config hash, and collects plugin cache keys.
4. **Load the cache** — reads `.docvia.cache.json` (when incremental) and checks compatibility via `cacheIsCompatible`.
5. **Walk and compile each collection** — reads the source tree with a parallelized BFS, then compiles files across a worker pool. The pool size is `cpus().length - 1` (at least one worker).
   - **Cache hit** — if the file hash matches a compatible cached entry, the cached `PageMeta` and route are reused and the file is counted as `cached`.
   - **Cache miss** — the file runs the full pipeline: `beforeParse` hook, frontmatter extraction and validation, `parseMarkdown`, `afterParse` hook, `beforeTransform` hook, `transformToIR`, composite content hashing, then the `afterTransform` and `beforeRender` hooks.
6. **Build frontmatter types** — if `config.frontmatter` is set, the type is generated with `zodSchemaToFrontmatterTs`; otherwise the type is the union of the unique frontmatter samples seen during the build.
7. **Emit the module graph** — writes the generated files (see below).
8. **Persist the cache** — when incremental, writes the new `.docvia.cache.json`.
9. **Return a `CompileResult`** — with per-page metadata, build duration, and `total` / `compiled` / `cached` stats.

### The generated module graph

`compile` writes the module graph below. Several files are always emitted into `outDir`, one is conditional, and one is emitted at the project root:

No page content is emitted — the content stays in the `.md` and is compiled in
place by the bundler's `?docvia` transform. The generated files are thin glue:

| File | Location | Emitted | Purpose |
| --- | --- | --- | --- |
| `dynamic.ts` | `outDir` | always | The route map plus `loadModule` / `getEagerModules` loaders over the `?docvia` page modules. |
| `source.ts` | `outDir` | always | Builds collections (eager `?docvia` imports, for server/SSR) and the `docviaSource` object via `@docvia/source`. |
| `browser.ts` | `outDir` | always | The lazy, client counterpart — `() => import()` per page, so each page code-splits. |
| `types.d.ts` | `outDir` | always | Per-collection `_RouteKey`, `_Frontmatter`, and `_DocPage` type declarations. |
| `registry.ts` | `outDir` | only when `config.components` is non-empty | The component registry, importing each configured component. |
| `docvia-env.d.ts` | `projectRoot` | always | Ambient `declare module` declarations for the source modules — `virtual:docvia/source` (+ `/browser`) for Vite and the bare `docvia/source` (+ `/browser`, plus `docvia/registry`) for Next.js. |

All generated files are marked auto-generated and should not be edited by hand.

## The incremental cache

The compiler persists its incremental state to a single JSON file in the output directory.

### `CACHE_FILE` and `CACHE_VERSION`

```ts
const CACHE_FILE = ".docvia.cache.json";
const CACHE_VERSION = 1;
```

`CACHE_FILE` is the on-disk filename. `CACHE_VERSION` is bumped whenever the cache shape changes incompatibly; a cache with a mismatched version is discarded on read.

### `CachedEntry`

```ts
interface CachedEntry {
  readonly fileHash: string;
  readonly contentHash: string;
  readonly page: PageMeta;
  readonly route: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `fileHash` | `string` | Hash of the raw file contents; compared to detect changes. |
| `contentHash` | `string` | The composite content hash. |
| `page` | `PageMeta` | The cached page metadata, reused verbatim on a hit. |
| `route` | `string` | The cached route string for the page. |

### `CacheFile`

```ts
interface CacheFile {
  readonly version: number;
  readonly toolVersion: string;
  readonly configHash: string;
  readonly pluginKeys: readonly string[];
  readonly entries: Record<string, CachedEntry>;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `version` | `number` | Cache shape version; must equal `CACHE_VERSION`. |
| `toolVersion` | `string` | Compiler version that wrote the cache. |
| `configHash` | `string` | Config hash at write time. |
| `pluginKeys` | `readonly string[]` | Plugin cache keys at write time. |
| `entries` | `Record<string, CachedEntry>` | Cached entries, keyed by `<collection>:<relativePath>`. |

### `readCache`

```ts
function readCache(outDir: string): Promise<CacheFile | null>
```

Reads and parses `<outDir>/.docvia.cache.json`. Returns `null` if the file is missing, unreadable, unparseable, or has a `version` that does not match `CACHE_VERSION`.

### `writeCache`

```ts
function writeCache(outDir: string, cache: CacheFile): Promise<void>
```

Serializes `cache` as pretty-printed JSON and writes it to `<outDir>/.docvia.cache.json`.

### `cacheIsCompatible`

```ts
function cacheIsCompatible(
  prev: CacheFile | null,
  toolVersion: string,
  configHash: string,
  pluginKeys: readonly string[],
): boolean
```

Returns `true` only when the previous cache exists and its `toolVersion`, `configHash`, and `pluginKeys` (same length and same order) all match the current build. When it returns `false`, every file is treated as a cache miss and rebuilt.

## Usage example

```ts
import { compile } from "@docvia/compiler";
import { defineConfig } from "@docvia/plugins";
import { reactRenderer } from "@docvia/renderer-react";
import type { CompileResult } from "@docvia/ir";

const config = defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
});

const result: CompileResult = await compile({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: reactRenderer(),
  plugins: config.plugins,
  config,
  projectRoot: process.cwd(),
  incremental: true,
});

console.log(
  `Built ${result.pages.length} pages in ${result.duration.toFixed(0)}ms ` +
    `(${result.stats.compiled} compiled, ${result.stats.cached} cached)`,
);
```

To force a clean rebuild — for example in CI — pass `incremental: false`.
