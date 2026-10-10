---
title: Configuration
description: Reference for docvia.config.ts (renderer, plugins, components, markdown) and defineDocs() options.
order: 5
---

# Configuration

Build settings live in `docvia.config.ts` at your project root; `defineConfig` adds types and defaults. Collections and frontmatter schemas are declared in code with `defineDocs()` (see [Collections](#collections)).

## Minimal config

```typescript
import { defineConfig } from "@docvia/build/next";
import { createReactRenderer } from "@docvia/core/react";

export default defineConfig({
  renderer: createReactRenderer(),
});
```

## Full reference

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `renderer` | `RendererAdapter` | none | Framework renderer (required) |
| `components` | record or array | none | Interactive component registry (globs allowed in the array form) |
| `plugins` | `docviaPlugin[]` | `[]` | Transform plugins |
| `markdown` | `{ remarkPlugins }` | `{ remarkPlugins: [] }` | Markdown processing options |
| `hashExclude` | `string[]` | none | Frontmatter keys left out of a page's `contentHash` |

## Custom frontmatter

Extend the built-in schema in `defineDocs()` with any Standard Schema library, such as Zod:

```typescript title="lib/source.ts"
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";
import { z } from "zod/v3";

const docs = defineDocs({
  dir: "docs",
  docs: {
    schema: z.object({
      author: z.string().optional(),
      category: z.enum(["guide", "reference", "tutorial"]).optional(),
    }),
  },
});

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

Built-in fields (`title`, `description`, `tags`, `order`, `slug`, `draft`) are always available. Your fields are merged and validated at build time, and `page.data` is typed from the schema's output.

## Syntax highlighting

Syntax highlighting is a build-time plugin from `@docvia/plugin-shiki`. It
highlights every code block during compilation and bakes the HTML into the IR,
so no highlighter ships to the browser.

```typescript
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  // ...
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["typescript", "tsx", "bash", "json", "css", "html"],
    }),
  ],
});
```

## Renderer

The renderer converts IR nodes into framework-specific output. For Next.js,
use `createReactRenderer`:

```typescript
import { createReactRenderer } from "@docvia/core/react";

createReactRenderer({
  registry: optionalCustomRegistry,
  transform: (output, doc) => output, // rewrite the RenderOutput tree
})
```

The renderer accepts an optional `registry` for resolving components at build
time. If omitted, components resolve at runtime through `defineRegistry()`. `transform`
rewrites each page's `RenderOutput` tree before it is serialized.

## Components

Register interactive components that can be embedded in Markdown:

```typescript
components: {
  counter: {
    path: "./components/Counter",
    hydrate: true,
    defaultProps: { initial: 0 },
  },
  chart: {
    path: "./components/Chart",
    hydrate: true,
  },
},
```

See [Components](/docs/components) for usage details.

## Collections

Each `defineDocs()` call is one collection. For several, call it once per
directory and give each its own `loader()`:

```typescript title="lib/source.ts"
const docs = defineDocs({ dir: "docs" });
const api = defineDocs({ dir: "api-docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
export const apiSource = loader({ baseUrl: "/api", source: api.toDocviaSource() });
```

`dir` is relative to the project root and must be a string literal.

> **Legacy:** `collections`, `frontmatter`, `sourceDir`, and `outDir` in
> `docvia.config.ts` still work but are superseded by `defineDocs()`.

## Remark plugins

Add remark plugins for custom Markdown processing:

```typescript
import remarkMath from "remark-math";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
  },
});
```
