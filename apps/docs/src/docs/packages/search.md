---
title: "@docvia/search"
description: "Section-level full-text search index for docvia documentation, powered by Orama."
eyebrow: "Packages"
order: 31
---

`@docvia/search` provides section-level full-text search over compiled docvia documentation, powered by [Orama](https://github.com/oramasearch/orama). It supports two modes:

- **Headless server search (recommended)** — build the index in memory on the server from the bundled docvia source and answer queries through a search endpoint. SSR/edge compatible: no static index is shipped to the browser, and the index is derived from the already-bundled `virtual:docvia/source` content, so there is no filesystem access or compiler at request time. This mirrors [Fumadocs' server search](https://www.fumadocs.dev/docs/headless/search).
- **Static index** — serialize the index to a string at build time and search it in the browser. For fully static sites with no server.

## Install

```bash
pnpm add @docvia/search
```

## Package exports

| Subpath | Resolves to | Purpose |
|---|---|---|
| `.` | package entry | Edge-safe runtime search — `createFromSource`, `createSearchHandler`, `createFetchClient`, the static `createSearch`, and the indexer/extraction APIs. |
| `./node` | Node entry | `buildSearchIndex` — compile the docs and emit a serialized static index (build time, Node only). |

This package ships no binary.

## Concepts

The index is **section-level**, not page-level. A page is split at each heading: everything between one heading and the next becomes a `SearchDocument`. This means a search result points directly at the relevant section of a page rather than just the page itself.

## Headless server search (recommended)

Build the index once per server instance from the docvia source, expose it as an endpoint, and query it from the client. The index lives in server memory and is built from content that is already bundled into the SSR output, so it runs anywhere the server runs — Node or the edge (Cloudflare Workers, etc.).

```ts
// src/routes/api/search/+server.ts  (SvelteKit)
import { createFromSource, createSearchHandler } from "@docvia/search";
import { docs } from "virtual:docvia/source";
import type { RequestHandler } from "./$types";

// Dynamic — runs in the worker, not prerendered.
export const prerender = false;

// Build the index lazily on first request, then reuse it.
let handler: Promise<(request: Request) => Promise<Response>> | null = null;
const getHandler = () =>
  (handler ??= createFromSource(docs).then(createSearchHandler));

export const GET: RequestHandler = async ({ request }) =>
  (await getHandler())(request);
```

```ts
// On the client — query the endpoint (debounce at the call site).
import { createFetchClient } from "@docvia/search";

const searcher = createFetchClient("/api/search");
const results = await searcher.search("incremental rebuild", { limit: 8 });
```

`createSearchHandler` returns a framework-agnostic Web `Request` handler, so the same server code drops into a Next.js route handler, a Hono route, or any Web-standard server.

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

Deserializes the string produced by `exportIndex()` and returns a client-side search helper (static mode).

- `options.limit` defaults to `10`.
- Field boosts during ranking: `sectionTitle` ×3, `pageTitle` ×2, `content` ×1 — so a query that matches a heading ranks above one that only matches body text.

### `createFromSource`

```ts
function createFromSource(
  source: docviaCollection | docviaSource,
  options?: { defaultLimit?: number },
): Promise<SearchServer>;
```

Headless server index. Walks every page's rendered `content` from a docvia source — a single collection (e.g. `docs` from `virtual:docvia/source`) or a whole `{ collections }` source — and builds an in-memory Orama index. Returns a `SearchServer` with `search(query, { limit })` and a `size` (indexed section count). Call once per server instance and cache the promise. Edge-safe: no filesystem, no compiler.

### `createSearchHandler`

```ts
function createSearchHandler(
  server: SearchServer,
): (request: Request) => Promise<Response>;
```

Wraps a `SearchServer` as a framework-agnostic Web `Request` handler. Reads `?query=` (or `?q=`) and an optional `?limit=`, and responds with the `SearchResult[]` as JSON.

### `createFetchClient`

```ts
function createFetchClient(endpoint?: string): {
  search(query: string, options?: { limit?: number }): Promise<SearchResult[]>;
};
```

Client helper for headless mode: queries a search endpoint backed by `createSearchHandler` (default `"/api/search"`) and returns the same `SearchResult[]` as the static client. Debounce calls at the call site.

### `extractSectionsFromContent`

```ts
function extractSectionsFromContent(
  content: RenderOutput | readonly RenderOutput[] | undefined,
  page: { slug: string; pageTitle: string },
): SearchDocument[];
```

The runtime counterpart to `extractSections`: splits a page's **rendered** `content` (a `RenderOutput` tree, as exported by a `?docvia` module) into section-level documents. Heading anchors come from `props.id`; highlighted code (`html` nodes) is stripped to text. Used internally by `createFromSource`.

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
