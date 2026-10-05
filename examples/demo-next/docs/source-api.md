---
title: Source API
description: Fetch pages, build navigation, and generate routes with loader().
order: 2
---

# Source API

`loader()` turns a `defineDocs()` collection into a source with methods to fetch
pages, build navigation, and generate routes. The method names match fumadocs.

```typescript title="lib/source.ts"
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

## getPage

Find a page by its slug segments. It is synchronous and returns frontmatter
only; call `page.data.load()` for the compiled body.

```typescript
const page = source.getPage(["getting-started"]);
if (!page) notFound();

// page.data   frontmatter (title, description, tags, ...) plus load()
// page.url    resolved URL path
// page.slugs  slug segments
// page.path   source path relative to the collection directory

const { content, toc, headings, manifest, structuredData } = await page.data.load();
```

`load()` compiles the page lazily in memory, keyed by content hash. For the
index page, pass an empty array or `undefined`:

```typescript
const index = source.getPage([]);
const index = source.getPage(undefined);
```

### Usage in Next.js

```typescript
export default async function DocPage({ params }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const { content } = await page.data.load();

  return <DocviaContent nodes={content} registry={registry} />;
}
```

## getPages

Returns every page with its frontmatter. Bodies are not loaded.

```typescript
const pages = source.getPages();
// [{ slugs: ["getting-started"], url: "/docs/getting-started", path: "getting-started.md", data: { title: "..." } }]
```

Useful for sitemaps, prev/next links, or custom navigation.

## getPageByHref

Resolve a link to its page and hash:

```typescript
const result = source.getPageByHref("/docs/source-api#getpage");
// { page, hash: "getpage" }
```

## pageTree

A lazily built navigation tree derived from your file structure. Matches the
fumadocs `PageTree` shape.

```typescript
const tree = source.pageTree;
// { name: "Docs", children: [...] }
```

### Node types

| Type | Fields | Description |
| --- | --- | --- |
| `page` | `name`, `url`, `$id`, `external?` | A navigable page or a `meta.json` link |
| `folder` | `name`, `children`, `index?`, `defaultOpen?`, `root?` | A directory with child pages |
| `separator` | `name` | A visual divider in navigation |

### meta.json

Add `meta.json` to a folder to control its title and order:

```json
{
  "title": "Guides",
  "pages": ["index", "---Basics---", "install", "...", "!drafts", "[GitHub](https://github.com)"],
  "defaultOpen": true
}
```

`...` inserts the remaining pages, `---Label---` adds a separator, `!name`
excludes an entry, and `[Text](url)` adds a link. `root: true` marks the folder
as a root.

### Rendering navigation

```typescript
function Nav({ nodes }) {
  return nodes.map(node => {
    if (node.type === "page") {
      return <a href={node.url}>{node.name}</a>;
    }
    if (node.type === "folder") {
      return (
        <details open>
          <summary>{node.name}</summary>
          <Nav nodes={node.children} />
        </details>
      );
    }
    return null;
  });
}
```

## generateParams

Parameters for Next.js `generateStaticParams`, so every page pre-renders at
build time.

```typescript
export async function generateStaticParams() {
  return source.generateParams();
}
// [{ slug: [] }, { slug: ["getting-started"] }, { slug: ["source-api"] }]
```

Custom parameter name:

```typescript
source.generateParams("path");
// [{ path: [] }, { path: ["getting-started"] }]
```

## getPageTree

Method form of `pageTree`. `serializePageTree(tree)` exists for fumadocs parity
and returns the tree unchanged.

```typescript
const tree = source.getPageTree();
```

## TypeScript types

Frontmatter types come from `defineDocs()`: the built-in fields plus your schema
output.

```typescript title="lib/source.ts"
import { z } from "zod/v3";

const docs = defineDocs({
  dir: "docs",
  docs: { schema: z.object({ author: z.string().optional() }) },
});

// source.getPage(slugs)?.data.author is string | undefined
```
