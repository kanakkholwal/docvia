---
title: Getting Started
description: Set up Docvia with SvelteKit in under 5 minutes.
order: 1
---

# Getting Started

Set up Docvia with SvelteKit. This guide covers installation, configuration, and creating your first documentation page.

## Installation

```bash
npm install @docvia/cli @docvia/renderer-svelte @docvia/plugin-vite shiki
```

## Configuration

Create `docvia.config.ts` in your project root:

```typescript
import { defineConfig } from "@docvia/cli";
import { createSvelteRenderer, createShikiHighlighter } from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  outDir: ".docvia",
  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({
      theme: "dracula",
      langs: ["typescript", "svelte", "bash", "json"],
    }),
  }),
});
```

Update `vite.config.ts` with the Docvia plugins:

```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), docviaSourcePlugin(), docviaMarkdownPlugin(config)],
});
```

## Create your first page

Create `src/docs/index.md`:

```markdown
---
title: Welcome
description: My documentation site
---

# Welcome

This is your first documentation page.
```

## Data loading

Create a server load function at `src/routes/+layout.server.ts`:

```typescript
import { docs } from "docvia/source";

export const load = async () => {
  const tree = docs.pageTree;
  return { tree };
};
```

And a page load at `src/routes/[...slug]/+page.server.ts`:

```typescript
import { docs } from "docvia/source";
import { error } from "@sveltejs/kit";

export const load = async ({ params }) => {
  const slugs = params.slug?.split("/") || [];
  const page = await docs.getPage(slugs);
  if (!page) throw error(404, "Page not found");
  return { page };
};
```

## Build and preview

```bash
npx docvia build
npm run dev
```

## Project structure

| Path | Purpose |
| --- | --- |
| `src/docs/` | Markdown source files |
| `.docvia/` | Generated output (gitignored) |
| `docvia.config.ts` | Docvia configuration |
| `src/routes/` | SvelteKit routes |

## Frontmatter fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Page title |
| `description` | `string` | No | Meta description |
| `order` | `number` | No | Sort order in navigation |
| `tags` | `string[]` | No | Tags for categorization |
| `slug` | `string` | No | Override the auto-generated slug |
| `draft` | `boolean` | No | Exclude from production |
