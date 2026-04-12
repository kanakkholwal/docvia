---
title: Configuration
description: Full reference for docvia.config.ts — frontmatter schemas, syntax highlighting, plugins, and collections.
order: 5
---

# Configuration

All Docvia settings live in `docvia.config.ts` at your project root. The `defineConfig` helper provides type safety and defaults.

## Minimal config

```typescript
import { defineConfig } from "@docvia/cli";
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

export default defineConfig({
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({ theme: "github-dark" }),
  }),
});
```

## Full reference

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sourceDir` | `string` | `"docs"` | Directory containing Markdown source files |
| `outDir` | `string` | `".docvia"` | Output directory for compiled artifacts |
| `renderer` | `RendererAdapter` | — | Framework renderer (required for builds) |
| `components` | `Record<string, ComponentConfig>` | `{}` | Interactive component registry |
| `frontmatter` | `ZodObject` | — | Extend built-in frontmatter fields |
| `plugins` | `docviaPlugin[]` | `[]` | Transform plugins |
| `collections` | `CollectionConfig[]` | Auto | Multi-collection setup |

## Custom frontmatter

Extend the built-in schema with Zod:

```typescript
import { z } from "zod";

export default defineConfig({
  frontmatter: z.object({
    author: z.string().optional(),
    category: z.enum(["guide", "reference", "tutorial"]).optional(),
    featured: z.boolean().optional(),
  }),
});
```

Built-in fields (`title`, `description`, `tags`, `order`, `slug`, `draft`) are always available. Your extensions are merged and validated at build time. The compiler generates a typed `Frontmatter` interface in `.docvia/types.d.ts`.

## Syntax highlighting

Docvia uses Shiki for build-time syntax highlighting. Configure themes and languages:

```typescript
createShikiHighlighter({
  theme: "github-dark",
  langs: ["typescript", "tsx", "bash", "json", "css", "html"],
})
```

Highlighting happens at build time — no client-side JavaScript is needed.

## Renderer

The renderer converts IR nodes into framework-specific output. For Next.js:

```typescript
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

createReactRenderer({
  highlighter: createShikiHighlighter({ theme: "github-dark" }),
  registry: optionalCustomRegistry,
})
```

The renderer also accepts an optional `registry` for resolving components at build time. If omitted, components pass through to runtime resolution.

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

By default, Docvia treats your `sourceDir` as a single `docs` collection. For multiple collections:

```typescript
collections: [
  { name: "docs", sourceDir: "./docs", baseUrl: "/" },
  { name: "api", sourceDir: "./api-docs", baseUrl: "/api" },
],
```

Each collection gets its own source API:

```typescript
import { docs, api } from "docvia/source";
```

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
