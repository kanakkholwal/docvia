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

```ts
import { createSearchIndexer, createSearch } from "@docvia/search";

const indexer = createSearchIndexer();
await indexer.buildIndex(pages);
const { search } = createSearch(indexer.exportIndex());
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
