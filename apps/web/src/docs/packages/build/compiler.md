---
title: "compile()"
description: "The batch build entry point: walks the source tree, runs the pipeline and emits the typed module graph."
eyebrow: "Packages"
order: 3
---

`compile()` from `@docvia/build` is docvia's batch build entry point. It walks a source tree of markdown files, runs each one through the full pipeline (plugin hooks, parsing with `@docvia/core/markdown`, frontmatter validation with `@docvia/core/schema`, and the AST to IR transform in `@docvia/core`), and emits a **module graph**: a small set of generated `.ts`/`.d.ts` files that frameworks like Vite and Next.js consume to load documentation pages.

> `compile()` is a thin wrapper over the [`CompileService`](/docs/packages/build/pipeline) in `@docvia/build`: it runs `compileAll()` and emits the disk module graph. Apps using `defineDocs()` with the Vite or Next.js plugin do not need it; pages compile on demand there. See [Architecture](/docs/guide/architecture).

Files compile **in parallel** across a worker pool. There is no disk cache: each run compiles in memory.

The package depends on `@docvia/core` and `@docvia/build`, which in turn uses [`@node-rs/xxhash`](https://github.com/napi-rs/node-rs) for fast content hashing.

## Installation

```bash
pnpm add @docvia/build
```

Requires Node.js `>=20.0.0`. ESM only.

## Exports

`@docvia/build` exposes a single entry point.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.js` | `compile`, `computeContentHash` (and its alias `hashContent`), and the `HashInputs` type. |

```ts
import { compile, computeContentHash } from "@docvia/build";
import type { CompilerOptions, CompileResult } from "@docvia/core";
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
| `frontmatter` | `string` | A stable stringification of the validated frontmatter, minus any `hashExclude` keys. |
| `configHash` | `string` | The deterministic hash of the resolved config. |
| `pluginCacheKeys` | `string[]` | One cache key per active plugin. |
| `dependencyHashes` | `string[]` | Content hashes of the document's dependencies. |

### `computeContentHash`

```ts
function computeContentHash(inputs: HashInputs): string
```

Joins all `HashInputs` fields with a `NUL` separator and returns the base-36 xxh64 digest of the result. This composite hash changes whenever the file, its frontmatter, the config, any plugin, or any dependency changes; the in-memory page pipeline keys compiled pages on it. Re-exported under the alias **`hashContent`**.

The config hash itself is produced internally by a stable JSON stringifier that sorts object keys (so declaration order does not matter) and skips function values (plugins are accounted for separately, via `pluginCacheKeys`).

## The `compile` function

### `compile`

```ts
function compile(options: CompilerOptions): Promise<CompileResult>
```

Runs a full build. Both `CompilerOptions` and `CompileResult` are defined in `@docvia/core`.

Defaults applied to `CompilerOptions`:

| Option | Default | Notes |
| --- | --- | --- |
| `projectRoot` | `process.cwd()` | Root for resolving relative paths and component files. |
| `config.collections` | `[{ name: "docs", sourceDir, baseUrl: "/" }]` | A single default collection when none are configured. |

The build proceeds as follows:

1. **Validate config.** Warns about non-string or duplicate entries in `syntax.langs`.
2. **Resolve collections.** Uses `config.collections`, or a single default `docs` collection.
3. **Prepare plugins and hashes.** Constructs a `PluginRunner`, computes the config hash, and collects plugin cache keys.
4. **Walk and compile each collection.** Scans the source tree, then compiles files across a worker pool of `cpus().length - 1` (at least one worker). Each file runs the full pipeline: `beforeParse` hook, frontmatter extraction and validation, `parseMarkdown`, `afterParse` hook, `beforeTransform` hook, `transformToIR`, composite content hashing, then the `afterTransform` and `beforeRender` hooks.
5. **Build frontmatter types.** If the collection has a schema (its own `frontmatter`, or the top-level one), the type is inferred from the schema's Standard Schema output type via `@docvia/core/schema`; otherwise it is the union of the unique frontmatter samples seen during the build.
6. **Emit the module graph.** Writes the generated files (see below).
7. **Return a `CompileResult`.** With per-page metadata, build duration, and `total` / `compiled` / `cached` stats (`cached` is always `0`).

### The generated module graph

`compile` writes the module graph below into `outDir`. A file is rewritten only when its content changes.

No page content is emitted. The content stays in the `.md` and is compiled in
place by the bundler's `?docvia` transform. The generated files are thin glue:

| File | Location | Emitted | Purpose |
| --- | --- | --- | --- |
| `source.ts` | `outDir` | always | Builds collections (eager `?docvia` imports, for server/SSR) and the `docviaSource` object via `@docvia/core/source`. |
| `browser.ts` | `outDir` | always | The lazy, client counterpart: one `() => import()` per page, so each page code-splits. |
| `registry.ts` | `outDir` | always | The component registry, importing each configured component (empty when none are configured). |
| `types.d.ts` | `outDir` | always | Per-collection `_RouteKey`, `_Frontmatter`, and `_DocPage` type declarations. |
| `env.d.ts` | `outDir` | always | Ambient `declare module` declarations: `virtual:docvia/source` (+ `/browser`) and `virtual:docvia/registry` for Vite, the bare `docvia/source` (+ `/browser`) and `docvia/registry` for Next.js. |

The generated code imports only `@docvia/core/source`, so the consuming app must depend on it directly.

All generated files are marked auto-generated and should not be edited by hand.

## Usage example

```ts
import { compile } from "@docvia/build";
import { defineConfig } from "@docvia/core";
import { createReactRenderer } from "@docvia/core/react";
import type { CompileResult } from "@docvia/core";

const config = defineConfig({ sourceDir: "docs", outDir: ".docvia" });

const result: CompileResult = await compile({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: config.plugins,
  config,
  projectRoot: process.cwd(),
});

console.log(`Built ${result.pages.length} pages in ${result.duration.toFixed(0)}ms`);
```
