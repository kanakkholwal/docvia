---
title: Source API
description: Access your compiled documentation with type-safe methods for pages, navigation, and route generation.
order: 2
---

# Source API

The source API is your interface to compiled documentation. Import the collection and use its methods to fetch pages, build navigation, and generate routes.

```typescript
import { docs } from "docvia/source";
```

## getPage

Fetch a single page by its slug segments. Returns the full page content, frontmatter, and metadata.

```typescript
const page = await docs.getPage(["getting-started"]);

if (!page) notFound();

// page.data      — frontmatter (title, description, tags, ...)
// page.content   — pre-compiled RenderOutput tree
// page.manifest  — hydration entries for interactive components
// page.headings  — array of { depth, text, id } for TOC
// page.url       — resolved URL path
// page.slugs     — slug segments as array
```

For the index page, pass an empty array or `undefined`:

```typescript
const index = await docs.getPage([]);
const index = await docs.getPage(undefined);
```

### Usage in Next.js

```typescript
export default async function DocPage({ params }) {
  const { slug } = await params;
  const page = await docs.getPage(slug);
  if (!page) notFound();

  return <DocviaContent nodes={page.content} />;
}
```

## getPages

Returns metadata for all pages in the collection. On the server, this includes full frontmatter data.

```typescript
const pages = docs.getPages();
// [{ slugs: ["getting-started"], url: "/getting-started", data: { title: "..." } }]
```

Useful for building sitemaps, search indices, or custom navigation.

## pageTree

A lazily-built navigation tree derived from your file structure. Matches the Fumadocs `PageTree` shape.

```typescript
const tree = docs.pageTree;
// { name: "docs", children: [...] }
```

### Node types

| Type | Fields | Description |
| --- | --- | --- |
| `page` | `name`, `url`, `$id` | A navigable documentation page |
| `folder` | `name`, `children`, `index?` | A directory with child pages |
| `separator` | `name` | A visual divider in navigation |

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

Generates parameters for Next.js `generateStaticParams`. Pre-renders all documentation pages at build time.

```typescript
export async function generateStaticParams() {
  return docs.generateParams();
}
// [{ slug: [] }, { slug: ["getting-started"] }, { slug: ["source-api"] }]
```

Custom parameter name:

```typescript
docs.generateParams("path");
// [{ path: [] }, { path: ["getting-started"] }]
```

## getPageTree

Method form of `pageTree` for future i18n support.

```typescript
const tree = docs.getPageTree();
```

## TypeScript types

The collection is fully typed based on your content:

```typescript
import type { docs_Frontmatter, docs_RouteKey } from "./.docvia/types";

// docs_RouteKey = "index" | "getting-started" | "source-api" | ...
// docs_Frontmatter = { title: string; description: string; order?: number; ... }
```
