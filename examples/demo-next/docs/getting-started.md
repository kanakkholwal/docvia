---
title: Getting Started
description: Set up Docvia with the Next.js App Router in under 5 minutes.
order: 1
---

# Getting Started

Set up Docvia in an existing Next.js (App Router) project: install, config, the
Next plugin, a source file, and a catch-all route that renders pages.

## 1. Install

```bash
npm install -D @docvia/build @docvia/plugin-shiki
npm install @docvia/core
```

The Next and Shiki plugins are dev-only. The renderer and `@docvia/core/source` are
runtime dependencies: your source file imports `@docvia/core/source`, and your routes
render with the renderer.

## 2. Configure Docvia

Create `docvia.config.ts` in your project root. It holds the renderer, plugins,
and components; collections are declared in code (step 4).

```typescript
import { defineConfig } from "@docvia/build/next";
import { shiki } from "@docvia/plugin-shiki";
import { createReactRenderer } from "@docvia/core/react";

export default defineConfig({
  renderer: createReactRenderer(),

  // Highlights code blocks at compile time, so no highlighter ships to the browser.
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["javascript", "typescript", "tsx", "jsx", "bash", "json", "css", "html"],
    }),
  ],
});
```

## 3. Wrap the Next config

`withDocvia` compiles in-process for **both webpack and Turbopack**. There is no
separate build step, and dev recompiles changed files.

```typescript
import { withDocvia } from "@docvia/build/next";

const withDocs = withDocvia();

export default withDocs({});
```

## 4. Declare the source

Create `lib/source.ts`. The plugin rewrites `defineDocs()` at build time into an
index of the folder, so nothing is scanned at runtime.

```typescript title="lib/source.ts"
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";

const docs = defineDocs({ dir: "docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

Add `lib/registry.ts` for the components listed in `docvia.config.ts`:

```typescript title="lib/registry.ts"
import { defineRegistry } from "@docvia/core/source/macro";

export const registry = defineRegistry();
```

`withDocvia` only transforms files named `source.{ts,tsx,js,mjs}` or
`registry.{ts,tsx,js}`. Use other names with `withDocvia({ macroFiles: [...] })`.

## 5. Create your first page

Create `docs/index.md`:

```markdown
---
title: Welcome
description: My documentation site
---

# Welcome

This is your first documentation page.
```

## 6. Render pages in a route

Add a catch-all route at `app/docs/[[...slug]]/page.tsx`. `Renderer` is a
React Server Component, so it renders on the server with no client bundle:

```tsx
import { Renderer } from "@docvia/core/react";
import { registry } from "@/lib/registry";
import { source } from "@/lib/source";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  return { title: page.data.title, description: page.data.description };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const { content } = await page.data.load();

  return (
    <article className="prose">
      <Renderer nodes={content} registry={registry} />
    </article>
  );
}
```

> **Interactive components.** Pages that use `:::component` directives return a
> hydration `manifest` from `page.data.load()`. Pass it to a client hydrator,
> such as the `DocviaHydrator` component in this demo.

## 7. Run it

```bash
npm run dev
```

Visit `http://localhost:3000/docs`. Pages compile lazily in memory on first
request, keyed by content hash; nothing is written to disk. `npm run build`
compiles every page returned by `generateStaticParams`.

## Project structure

| Path | Purpose |
| --- | --- |
| `docs/` | Markdown source files and optional `meta.json` per folder |
| `lib/source.ts` | `defineDocs()` collection and `loader()` source |
| `lib/registry.ts` | `defineRegistry()` component registry |
| `docvia.config.ts` | Renderer, plugins, components, markdown options |
| `app/docs/` | Next.js routes for documentation |

## Frontmatter fields

Every Markdown file starts with YAML frontmatter:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Page title, used in navigation and metadata |
| `description` | `string` | No | Meta description for SEO |
| `order` | `number` | No | Sort order in navigation |
| `tags` | `string[]` | No | Tags for categorization |
| `slug` | `string` | No | Override the auto-generated slug |
| `draft` | `boolean` | No | Draft flag; filter it in your routes |

Add custom fields with a Standard Schema (Zod, Valibot, ArkType) in
`defineDocs({ docs: { schema } })`. See [Configuration](/docs/configuration).
