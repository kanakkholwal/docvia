---
title: Source API
description: Access your compiled documentation with type-safe methods for pages, navigation, and route generation.
order: 2
---

# Source API

The source API is your interface to compiled documentation. Import the collection and use its methods in your SvelteKit load functions.

```typescript
import { docs } from "docvia/source";
```

## getPage

Fetch a single page by its slug segments:

```typescript
const page = await docs.getPage(["getting-started"]);

// page.data      — frontmatter (title, description, tags, ...)
// page.content   — pre-compiled RenderOutput tree
// page.manifest  — hydration entries for interactive components
// page.headings  — array of { depth, text, id } for TOC
// page.url       — resolved URL path
// page.slugs     — slug segments as array
```

### Usage in SvelteKit

```typescript
// +page.server.ts
import { docs } from "docvia/source";
import { error } from "@sveltejs/kit";

export const load = async ({ params }) => {
  const slugs = params.slug?.split("/") || [];
  const page = await docs.getPage(slugs);
  if (!page) throw error(404, "Page not found");
  return { page };
};
```

## getPages

Returns metadata for all pages in the collection:

```typescript
const pages = docs.getPages();
// [{ slugs: ["getting-started"], url: "/getting-started", data: { title: "..." } }]
```

## pageTree

A lazily-built navigation tree derived from your file structure:

```typescript
const tree = docs.pageTree;
// { name: "docs", children: [...] }
```

### Node types

| Type | Fields | Description |
| --- | --- | --- |
| `page` | `name`, `url`, `$id` | A navigable page |
| `folder` | `name`, `children`, `index?` | A directory with child pages |
| `separator` | `name` | A visual divider |

## generateParams

Generates route parameters for SvelteKit prerendering:

```typescript
// +page.server.ts
export const entries = () => {
  return docs.getPages().map(p => ({
    slug: p.slugs.join("/") || undefined,
  }));
};
```

## TypeScript types

The collection is fully typed:

```typescript
import type { docs_Frontmatter, docs_RouteKey } from "./.docvia/types";
```
