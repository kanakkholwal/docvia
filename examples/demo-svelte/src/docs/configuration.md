---
title: Configuration
description: Full reference for docvia.config.ts with SvelteKit.
order: 5
---

# Configuration

Build settings live in `docvia.config.ts` at your project root; `defineConfig`
adds types and defaults. Collections and frontmatter schemas are declared in
`src/lib/source.ts` with `defineDocs()`.

## Minimal config

```typescript
import { defineConfig } from "@docvia/plugin-vite";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
  renderer: createSvelteRenderer(),
});
```

## Full reference

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `renderer` | `RendererAdapter` | none | Framework renderer (required) |
| `components` | record or array | none | Interactive component registry (globs allowed in the array form) |
| `plugins` | `docviaPlugin[]` | `[]` | Build-time transform plugins |
| `markdown` | `{ remarkPlugins }` | `{ remarkPlugins: [] }` | Markdown processing options |
| `hashExclude` | `string[]` | none | Frontmatter keys left out of a page's `contentHash` |

> **Legacy:** `collections`, `frontmatter`, `sourceDir`, and `outDir` still work
> in config but are superseded by `defineDocs()`.

## Custom frontmatter

Extend the built-in schema in `defineDocs()` with any Standard Schema library,
such as Zod. Built-in fields (`title`, `description`, `tags`, `order`, `slug`,
`draft`) are always available; your fields are validated at build time and typed
on `page.data`. Each `defineDocs()` call is its own collection with its own schema.

```typescript title="src/lib/source.ts"
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";
import { z } from "zod";

const docs = defineDocs({
  dir: "src/docs",
  docs: {
    schema: z.object({
      author: z.string().optional(),
      category: z.enum(["guide", "reference"]).optional(),
    }),
  },
});

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

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
      theme: "dracula",
      langs: ["typescript", "svelte", "bash", "json", "css", "html"],
    }),
  ],
});
```

## Vite integration

`vite.config.ts` needs the single `docvia()` plugin. With no arguments it loads
`docvia.config.ts`, rewrites `defineDocs()` / `defineRegistry()` calls, and
compiles pages in-process during dev and build.

```typescript
import { docvia } from "@docvia/plugin-vite";
import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() }), docvia()],
});
```
