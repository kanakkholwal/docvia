# @docvia/search

Section-level Orama indexing and client search helper for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia), a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/search
```

## Usage

Headless server search indexes a `loader()` source in memory, from the
`structuredData` each page emits at compile time. `records` adds non-Markdown
entries to the same index, and each result carries a `url` (page URL plus
`#heading`):

```ts
import { createFromSource, createSearchHandler } from "@docvia/search";
import { source } from "@/lib/source";

const server = await createFromSource(source, {
  records: [{ id: "api:docvia", title: "docvia()", url: "/docs/api#docvia", body: "The Vite plugin." }],
});
export const GET = createSearchHandler(server);
```

Query it from the browser with `createFetchClient("/api/search")`.

For a static index, compile the docs at build time (Node):

```ts
import { buildSearchIndex } from "@docvia/search/node";

// `configPath` defaults to "docvia.config.ts"; `collection` scopes the index.
const indexJson = await buildSearchIndex({ collection: "docs" });
// Serve `indexJson` as a static asset.
```

Search the static index (browser / runtime):

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
