# @docvia/search

Section-level Orama indexing and client search helper for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/search
```

## Usage

Build the index from a docvia build output directory (Node / build time):

```ts
import { buildSearchIndex } from "@docvia/search/node";

// Reads the IR chunks docvia emits to `<outDir>/ir/`. `outDir` defaults to
// ".docvia"; pass `collection` to scope the index to one collection.
const indexJson = await buildSearchIndex({ collection: "docs" });
// → serve `indexJson` as a static asset
```

Search the index (browser / runtime):

```ts
import { createSearch } from "@docvia/search";

const { search } = await createSearch(indexJson);
const hits = await search("getting started", { limit: 8 });
```

For full control, `createSearchIndexer()` and `loadIRDocuments()` expose the
indexing and document-loading steps separately.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
