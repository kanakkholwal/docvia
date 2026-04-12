---
title: Configuration
description: Full reference for docvia.config.ts with SvelteKit.
order: 5
---

# Configuration

All Docvia settings live in `docvia.config.ts` at your project root.

## Minimal config

```typescript
import { defineConfig } from "@docvia/cli";
import { createSvelteRenderer, createShikiHighlighter } from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({ theme: "dracula" }),
  }),
});
```

## Full reference

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sourceDir` | `string` | `"docs"` | Markdown source directory |
| `outDir` | `string` | `".docvia"` | Output directory |
| `renderer` | `RendererAdapter` | — | Framework renderer |
| `components` | `Record<string, ComponentConfig>` | `{}` | Interactive components |
| `frontmatter` | `ZodObject` | — | Extend frontmatter fields |
| `plugins` | `docviaPlugin[]` | `[]` | Transform plugins |

## Custom frontmatter

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

```typescript
createShikiHighlighter({
  theme: "dracula",
  langs: ["typescript", "svelte", "bash", "json", "css", "html"],
})
```

## Vite integration

Your `vite.config.ts` needs the Docvia plugins:

```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), docviaSourcePlugin(), docviaMarkdownPlugin(config)],
});
```

The source plugin resolves `docvia/source` imports. The markdown plugin transforms `.md?docvia` imports at build time.
