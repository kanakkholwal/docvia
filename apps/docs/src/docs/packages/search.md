---
title: "@docvia/search"
description: "Section-level full-text search index for docvia documentation, powered by Orama."
eyebrow: "Packages"
order: 31
---

`@docvia/search` builds a section-level full-text search index over compiled docvia documentation. It extracts one searchable section per heading region from `IRDocument`s, indexes them with [Orama](https://github.com/oramasearch/orama), supports incremental updates keyed by slug, serializes the index to a transferable string, and provides a client-side search helper with title-weighted ranking.

## Install

```bash
pnpm add @docvia/search
```

## Package exports

| Subpath | Resolves to | Purpose |
|---|---|---|
| `.` | package entry | All extraction, indexing, and search APIs. |

This package ships no binary.

## Concepts

The index is **section-level**, not page-level. A page is split at each heading: everything between one heading and the next becomes a `SearchDocument`. This means a search result points directly at the relevant section of a page rather than just the page itself.

## API reference

### `extractTextFromIR`

```ts
function extractTextFromIR(children: readonly IRNode[]): string;
```

Recursively walks an array of IR nodes and concatenates their textual content. Plain text nodes contribute their text; code blocks contribute their `value`. The result is the flat, searchable text for a region.

### `extractSections`

```ts
function extractSections(doc: IRDocument): SearchDocument[];
```

Splits a single `IRDocument` into one `SearchDocument` per heading region.

- The `sectionId` is the heading's `id`, or `"_top"` for the region preceding the first heading.
- Empty sections (no extracted text) are dropped.

### `interface SearchIndexer`

```ts
interface SearchIndexer {
  buildIndex(pages: readonly IRDocument[]): Promise<void>;
  updateIndex(changed: readonly IRDocument[], removed: readonly string[]): Promise<void>;
  exportIndex(): Promise<string>;
}
```

| Method | Behavior |
|---|---|
| `buildIndex` | Indexes a full set of pages from scratch. |
| `updateIndex` | Incrementally re-indexes `changed` pages and drops every section belonging to a `removed` slug. |
| `exportIndex` | Serializes the current index to a string suitable for shipping to the client. |

### `createSearchIndexer`

```ts
function createSearchIndexer(): Promise<SearchIndexer>;
```

Creates a `SearchIndexer`. The Orama schema is:

```ts
{
  sectionTitle: "string",
  pageTitle: "string",
  content: "string",
  slug: "string",
  sectionId: "string",
  depth: "number"
}
```

The indexer maintains an internal `slug → ids` map so `updateIndex` can find and remove every section document that belongs to a changed or removed slug.

### `interface SearchResult`

```ts
interface SearchResult {
  slug: string;
  sectionId: string;
  sectionTitle: string;
  pageTitle: string;
  score: number;
}
```

| Field | Meaning |
|---|---|
| `slug` | Slug of the page the section belongs to. |
| `sectionId` | Heading id of the matched section (`"_top"` for the lead region). |
| `sectionTitle` | Heading text of the matched section. |
| `pageTitle` | Title of the containing page. |
| `score` | Relevance score from Orama. |

### `createSearch`

```ts
function createSearch(indexData: string): Promise<{
  search(query: string, options?: { limit?: number }): Promise<SearchResult[]>;
}>;
```

Deserializes the string produced by `exportIndex()` and returns a client-side search helper.

- `options.limit` defaults to `10`.
- Field boosts during ranking: `sectionTitle` ×3, `pageTitle` ×2, `content` ×1 — so a query that matches a heading ranks above one that only matches body text.

### `SearchDocument`

Re-exported from `@docvia/ir`:

```ts
interface SearchDocument {
  slug: string;
  sectionId: string;
  sectionTitle: string;
  content: string;
  depth: number;
  pageTitle: string;
}
```

A single indexable section. `depth` is the heading depth of the section.

## Usage

### Build the index (build time)

```ts
import { createSearchIndexer } from "@docvia/search";

const indexer = await createSearchIndexer();
await indexer.buildIndex(allDocuments);

const serialized = await indexer.exportIndex();
// Persist `serialized` — e.g. write it to a static asset.
```

### Incremental updates (dev / watch)

```ts
// `changedDocs` are re-parsed IRDocuments; `removedSlugs` were deleted.
await indexer.updateIndex(changedDocs, removedSlugs);
const serialized = await indexer.exportIndex();
```

### Search (client side)

```ts
import { createSearch } from "@docvia/search";

const { search } = await createSearch(serialized);

const results = await search("incremental rebuild", { limit: 5 });
for (const r of results) {
  console.log(`${r.pageTitle} › ${r.sectionTitle}  (#${r.sectionId})`);
}
```
