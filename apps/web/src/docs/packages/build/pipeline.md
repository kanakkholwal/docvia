---
title: "Pipeline and compile service"
description: "The page pipeline and defineDocs() transform shared by the Vite plugin, the Next.js plugin and the CLI."
eyebrow: "Packages"
order: 2
---

The pipeline and compile service are the heart of `@docvia/build`. Every integration drives them:

- [`@docvia/build/vite`](/docs/packages/build/vite) and
  [`@docvia/build/next`](/docs/packages/build/next) run `transformMacroModule()`
  on `defineDocs()` files and compile page bodies on demand through
  `PagePipeline`.
- [`@docvia/build`](/docs/packages/build/compiler) and the CLI use `CompileService`,
  a batch wrapper over the same pipeline.
- [`@docvia/core/ssr`](/docs/packages/core/ssr): a `CompileService` is a valid
  `ContentSource` for `createDocviaSSR({ provider })`.

> `@docvia/build` is the engine, not a public-facing API. Apps use
> `@docvia/core/source` and a framework plugin. This page is for plugin and adapter
> authors.

## Installation

```bash
pnpm add @docvia/build
```

Requires Node.js `>=20.0.0`. ESM only.

## In-memory, on demand

Nothing is cached to disk. `PagePipeline` reads frontmatter alone for the page
index and compiles a body only when it is requested, memoised in memory by
content hash (source, frontmatter, config and plugin cache keys). A failed
compile is not memoised, so the next request retries.

## API reference

### `PagePipeline`

```ts
class PagePipeline {
  constructor(config: docviaConfig, projectRoot: string);
}
```

| Member | Purpose |
|---|---|
| `collections` | Config collections plus any registered by `defineDocs()`. |
| `registerCollection(def)` | Add or update a collection declared in code. |
| `locate(absPath)` | The collection that owns a file. |
| `meta(absPath, code, collection?)` | Frontmatter only, validated, no Markdown parse. |
| `document(absPath, code, collection?)` | The compiled `IRDocument`. |
| `module(absPath, code, collection?)` | The rendered page module source (`meta`, `content`, `manifest`, `structuredData`). |

### `transformMacroModule`

```ts
function transformMacroModule(
  code: string,
  id: string,
  ctx: MacroTransformContext,
): Promise<MacroTransformResult | null>;
```

Rewrites `defineDocs()` / `defineRegistry()` calls imported from
`@docvia/core/source/macro` (`MACRO_SOURCE`) into runtime calls carrying the folder's
frontmatter inline and lazy page bodies. Returns `null` when the module has none.

| `ctx` field | Purpose |
|---|---|
| `root`, `config` | Project root and resolved docvia config. |
| `index(collection)` | Register the collection; resolve its frontmatter keyed by relative path. |
| `evaluate()` | Optional. Evaluate the module to read non-literal options (schemas). |
| `emit` | `{ kind: "glob", bodiesModule }` (Vite, `import.meta.glob`) or `{ kind: "explicit" }` (one `import()` per page). |

The result carries `code`, a source `map` and the `collections` the module
declares, for HMR.

Related helpers:

| Export | Purpose |
|---|---|
| `collectMacroOptions(root, load)` | Run `load()` with `defineDocs()` recording its options instead of throwing, to read schemas. |
| `findMacroModules(root, names)` | Files with those names that import `@docvia/core/source/macro`. |
| `macroCollectionName(root, dir)` | Stable collection name for a directory. |

### `CompileService`

Batch compiler for hosts that need everything up front.

| Method | Purpose |
|---|---|
| `compileAll()` | Compile every page of every collection. |
| `invalidate(filePaths)` | Recompile changed files; returns an `InvalidationResult`. |
| `getDocument(collection, slug)` | A compiled `IRDocument` by route. |
| `getDocuments(collection?)` | Every compiled document. Call after `compileAll()`. |
| `collectionDirs()` | Every collection's directory, for watchers. |
| `emitDiskModuleGraph()` | Write the legacy `.docvia/` module graph. |
| `emitTypeDeclarations()` | Write `.docvia/types.d.ts` and `.docvia/env.d.ts`. |

### `InvalidationResult`

```ts
interface InvalidationResult {
  readonly changed: string[];        // routes whose output changed
  readonly routeMapChanged: boolean; // whether the set of routes changed
}
```

### `syncTypes`

```ts
function syncTypes(options?: { cwd?: string; configPath?: string }): Promise<{ outDir: string; pages: number }>;
```

Writes `.docvia/types.d.ts` and `.docvia/env.d.ts` for legacy config collections,
from frontmatter alone. `docvia sync` calls it. `defineDocs()` apps need no
generated types.

## See also

- [Architecture](/docs/guide/architecture): how the compile core fits the run
  modes.
- [`@docvia/core/source`](/docs/packages/core/source): `defineDocs()` and `loader()`.
- [`@docvia/core/ssr`](/docs/packages/core/ssr): request-time rendering.
