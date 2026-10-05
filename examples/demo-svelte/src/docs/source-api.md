---
title: Source API
description: Fetch pages, build navigation, and prerender routes with loader().
order: 2
---

# Source API

`loader()` turns a `defineDocs()` collection into a source you call from
SvelteKit load functions. The method names match fumadocs.

```typescript title="src/lib/source.ts"
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "src/docs" });

export const source = loader({
  baseUrl: "/docs",
  source: docs.toDocviaSource(),
});
```

## getPage

Find a page by its slug segments. It is synchronous and returns frontmatter
only; call `page.data.load()` for the compiled body.

```typescript
const page = source.getPage(["getting-started"]);

// page.data   frontmatter (title, description, tags, ...) plus load()
// page.url    resolved URL path
// page.slugs  slug segments

const { content, toc, headings, manifest, structuredData } = await page.data.load();
```

### Usage in SvelteKit

```typescript
// +page.server.ts
import { error } from "@sveltejs/kit";
import { source } from "#lib/source.ts";

export const load = async ({ params }) => {
  const page = source.getPage(params.slug?.split("/").filter(Boolean));
  if (!page) error(404, "Page not found");
  const { content, headings } = await page.data.load();
  return { page: { title: page.data.title, content, headings } };
};
```

## getPages

Returns every page with its frontmatter. Bodies are not loaded.

```typescript
const pages = source.getPages();
// [{ slugs: ["getting-started"], url: "/docs/getting-started", path: "getting-started.md", data: { title: "..." } }]
```

`source.getPageByHref("/docs/source-api#getpage")` resolves a link to `{ page, hash }`.

## pageTree

A lazily built navigation tree derived from your file structure and `meta.json`
files:

```typescript
const tree = source.pageTree;
// { name: "Docs", children: [...] }
```

### Node types

| Type | Fields | Description |
| --- | --- | --- |
| `page` | `name`, `url`, `$id`, `external?` | A navigable page or a `meta.json` link |
| `folder` | `name`, `children`, `index?`, `defaultOpen?`, `root?` | A directory with child pages |
| `separator` | `name` | A visual divider |

A folder's `meta.json` sets `title`, `pages` (order; supports `...`,
`---Separator---`, `!exclude`, `[Text](url)`), `defaultOpen`, and `root`.

## Prerendering

`source.generateParams()` returns `{ slug: string[] }` entries. SvelteKit rest
params are strings, so join the slugs:

```typescript
// +page.server.ts
export const entries = () =>
  source.getPages().map((p) => ({ slug: p.slugs.join("/") }));
```

## TypeScript types

`page.data` is typed from `defineDocs()`: the built-in fields plus the output of
an optional `docs.schema` (any Standard Schema library).
