---
title: Getting Started
description: Set up Docvia with SvelteKit in under 5 minutes.
order: 1
---

# Getting Started

Set up Docvia in an existing SvelteKit project. Follow these steps in order and
you'll have a working docs section at the end — installation, config, the Vite
plugin, TypeScript wiring, and a catch-all route that renders pages.

## 1. Install

```bash
npm install -D @docvia/cli @docvia/plugin-vite @docvia/plugin-shiki
npm install @docvia/renderer-svelte @docvia/source
```

The CLI, Vite plugin, and Shiki plugin are dev-only. The renderer and
`@docvia/source` are runtime dependencies — the generated module graph imports
from them.

## 2. Configure Docvia

Create `docvia.config.ts` in your project root:

```typescript
import { defineConfig } from "@docvia/cli";
import { shiki } from "@docvia/plugin-shiki";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  outDir: ".docvia",
  collections: [{ name: "docs", sourceDir: "src/docs", baseUrl: "/docs" }],

  renderer: createSvelteRenderer(),

  // Syntax highlighting is a build-time plugin: it highlights every code block
  // during compilation and bakes the HTML into the IR, so no highlighter ships
  // to the browser.
  plugins: [
    shiki({
      theme: "dracula",
      langs: ["javascript", "typescript", "svelte", "html", "css", "bash", "json"],
    }),
  ],
});
```

> Note the `/node` subpath on `@docvia/renderer-svelte/node` — that's the
> build-time entry used inside the config. The `<Renderer>` component in step 5
> imports from `@docvia/renderer-svelte` (no subpath).

## 3. Add the Vite plugin

Update `vite.config.ts` to run Docvia in-process. The single `docvia()` plugin
compiles your Markdown during dev and build — there's no separate
`docvia build` step, and edits recompile incrementally with HMR.

```typescript
import { docvia } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [sveltekit(), docvia(docviaConfig)],
});
```

## 4. Declare the module types

So `docvia/source` resolves in TypeScript, add a `docvia-env.d.ts` at the
project root:

```typescript
declare module "docvia/source" {
  const source: typeof import("./.docvia/source");
  export const docviaSource: typeof source.docviaSource;
  export const docs: typeof source.docs;
  export const registry: typeof source.registry;
}
declare module "docvia/registry" {
  const mod: typeof import("./.docvia/registry");
  export const registry: typeof mod.registry;
}
```

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

Add a server load that exposes the page tree at `src/routes/docs/+layout.server.ts`:

```typescript
import { docs } from "docvia/source";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
  return { tree: docs.pageTree };
};
```

Add a catch-all page load at `src/routes/docs/[...slug]/+page.server.ts`:

```typescript
import { error } from "@sveltejs/kit";
import { docs } from "docvia/source";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const slugs = params.slug ? params.slug.split("/") : [];
  const page = await docs.getPage(slugs);
  if (!page) throw error(404, "Page not found");
  return { page };
};
```

And render it in `src/routes/docs/[...slug]/+page.svelte` with the `Renderer`
component and the generated `registry`:

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import { registry } from "docvia/source";
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

The `docvia()` Vite plugin compiles `src/docs/` on startup and on every edit —
no separate build command needed. Visit `/docs` and you'll see your page.

For a production build, `npm run build` runs the same compilation.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/docs/` | Markdown source files |
| `.docvia/` | Generated module graph (gitignore this) |
| `docvia.config.ts` | Docvia configuration |
| `docvia-env.d.ts` | TypeScript module declarations |
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
</content>
</invoke>
