---
title: Configuration
description: Full reference for docvia.config.ts with SvelteKit.
order: 5
---

# Configuration

All Docvia settings live in `docvia.config.ts` at your project root. The
`defineConfig` helper provides type safety and sensible defaults.

## Minimal config

```typescript
import { defineConfig } from "@docvia/plugin-vite";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  renderer: createSvelteRenderer(),
});
```

## Full reference

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sourceDir` | `string` | `"docs"` | Markdown source directory |
| `outDir` | `string` | `".docvia"` | Output directory for the generated module graph |
| `renderer` | `RendererAdapter` | — | Framework renderer (required for builds) |
| `collections` | `CollectionConfig[]` | Auto | Multi-collection setup: `{ name, sourceDir, baseUrl?, frontmatter?, optional? }` |
| `components` | record or array | none | Interactive component registry (globs allowed in the array form) |
| `frontmatter` | Standard Schema | none | Extend built-in frontmatter fields (Zod, Valibot, ArkType, ...) |
| `hashExclude` | `string[]` | none | Frontmatter keys left out of a page's `contentHash` |
| `plugins` | `docviaPlugin[]` | `[]` | Build-time transform plugins |

## Custom frontmatter

Extend the built-in schema with any Standard Schema library, such as Zod.
Built-in fields (`title`, `description`, `tags`, `order`, `slug`, `draft`) are
always available; your extensions are validated at build time and typed in the
generated `.docvia/types.d.ts`. A collection can set its own `frontmatter`.

```typescript
import { z } from "zod";

export default defineConfig({
  frontmatter: z.object({
    author: z.string().optional(),
    category: z.enum(["guide", "reference"]).optional(),
  }),
});
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

`vite.config.ts` needs the single `docvia()` plugin. It loads `docvia.config.ts`
and runs the compiler in-process during dev and build, with no separate step.

```typescript
import { docvia } from "@docvia/plugin-vite";
import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() }), docvia()],
});
```
