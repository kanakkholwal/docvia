---
title: Getting Started
description: Set up Docvia with SvelteKit in under 5 minutes.
order: 1
---

# Getting Started

Set up Docvia in an existing SvelteKit project: install, config, the Vite
plugin, a source file, and a catch-all route that renders pages.

## 1. Install

```bash
npm install -D @docvia/build @docvia/plugin-shiki
npm install @docvia/core
```

The Vite and Shiki plugins are dev-only. The renderer and `@docvia/core/source` are
runtime dependencies: your source file imports `@docvia/core/source`, and your routes
render with the renderer.

## 2. Configure Docvia

Create `docvia.config.ts` in your project root. It holds the renderer, plugins,
and components; collections are declared in code (step 4).

```typescript
import { defineConfig } from "@docvia/build/vite";
import { shiki } from "@docvia/plugin-shiki";
import { createSvelteRenderer } from "@docvia/core/svelte/node";

export default defineConfig({
  renderer: createSvelteRenderer(),

  // Highlights code blocks at compile time, so no highlighter ships to the browser.
  plugins: [
    shiki({
      theme: "dracula",
      langs: ["javascript", "typescript", "svelte", "html", "css", "bash", "json"],
    }),
  ],
});
```

> Note the `/node` subpath on `@docvia/core/svelte/node`: that is the
> build-time entry used inside the config. The `<Renderer>` component in step 6
> imports from `@docvia/core/svelte` (no subpath).

## 3. Add the Vite plugin

Update `vite.config.ts`. With no arguments, `docvia()` loads `docvia.config.ts`
and compiles Markdown during dev and build, with HMR on edits. SvelteKit 3 takes
its options in `sveltekit({ ... })`; there is no `svelte.config.js`.

```typescript
import { docvia } from "@docvia/build/vite";
import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() }), docvia()],
});
```

## 4. Declare the source

Create `src/lib/source.ts`. The plugin rewrites `defineDocs()` at build time into
an index of the folder, so nothing is scanned at runtime.

```typescript title="src/lib/source.ts"
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";

const docs = defineDocs({ dir: "src/docs" });

export const source = loader({
  baseUrl: "/docs",
  source: docs.toDocviaSource(),
});
```

Add `src/lib/registry.ts` for the components listed in `docvia.config.ts`:

```typescript title="src/lib/registry.ts"
import { defineRegistry } from "@docvia/core/source/macro";

export const registry = defineRegistry();
```

Types come from `defineDocs()`, so there is no generated types file or sync step.

## 5. Create your first page

Create `src/docs/index.md`:

```markdown
---
title: Welcome
description: My documentation site
---

# Welcome

This is your first documentation page.
```

## 6. Render pages in a route

Expose the page tree from `src/routes/docs/+layout.server.ts`:

```typescript
import { source } from "#lib/source.ts";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = () => ({ tree: source.pageTree });
```

Add a catch-all page load at `src/routes/docs/[...slug]/+page.server.ts`:

```typescript
import { error } from "@sveltejs/kit";
import { source } from "#lib/source.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const page = source.getPage(params.slug?.split("/").filter(Boolean));
  if (!page) error(404, "Page not found");
  const { content, headings } = await page.data.load();
  return { page: { title: page.data.title, content, headings } };
};
```

And render it in `src/routes/docs/[...slug]/+page.svelte` with the `Renderer`
component and the registry:

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/core/svelte";
  import { registry } from "#lib/registry.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<article>
  <Renderer nodes={data.page.content} {registry} />
</article>
```

## 7. Run it

```bash
npm run dev
```

Visit `/docs`. Pages compile lazily in memory on first request, keyed by content
hash; nothing is written to disk. `npm run build` uses the same pipeline.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/docs/` | Markdown source files and optional `meta.json` per folder |
| `src/lib/source.ts` | `defineDocs()` collection and `loader()` source |
| `src/lib/registry.ts` | `defineRegistry()` component registry |
| `docvia.config.ts` | Renderer, plugins, components, markdown options |
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
