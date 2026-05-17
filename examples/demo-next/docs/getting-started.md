---
title: Getting Started
description: Set up Docvia with the Next.js App Router in under 5 minutes.
order: 1
---

# Getting Started

Set up Docvia in an existing Next.js (App Router) project. Follow these steps
in order and you'll have a working docs section — installation, config, the
Next plugin, TypeScript wiring, and a catch-all route that renders pages.

## 1. Install

```bash
npm install -D @docvia/cli @docvia/plugin-next @docvia/plugin-shiki
npm install @docvia/renderer-react @docvia/source
```

The CLI, Next plugin, and Shiki plugin are dev-only. The renderer and
`@docvia/source` are runtime dependencies — the generated module graph imports
from them.

## 2. Configure Docvia

Create `docvia.config.ts` in your project root:

```typescript
import { defineConfig } from "@docvia/cli";
import { shiki } from "@docvia/plugin-shiki";
import { createReactRenderer } from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  collections: [{ name: "docs", sourceDir: "docs", baseUrl: "/docs" }],

  renderer: createReactRenderer(),

  // Syntax highlighting is a build-time plugin: it highlights every code block
  // during compilation and bakes the HTML into the IR, so no highlighter ships
  // to the browser.
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["javascript", "typescript", "tsx", "jsx", "bash", "json", "css", "html"],
    }),
  ],
});
```

## 3. Wrap the Next config

Update `next.config.ts` so Docvia compiles in-process. `withDocvia` runs the
compiler on config evaluation and aliases `docvia/source` for **both webpack
and Turbopack** — there's no separate `docvia build` step, and dev recompiles
changed files incrementally.

```typescript
import { withDocvia } from "@docvia/plugin-next";

const withDocs = withDocvia();

export default withDocs({});
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

Add a catch-all route at `app/docs/[[...slug]]/page.tsx`. `DocviaContent` is a
React Server Component, so it renders on the server with no client bundle:

```tsx
import { DocviaContent } from "@docvia/renderer-react";
import { docs, registry } from "docvia/source";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams() {
  return docs.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await docs.getPage(slug);
  if (!page) return {};
  return { title: page.data.title, description: page.data.description };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await docs.getPage(slug);
  if (!page) notFound();

  return (
    <article className="prose">
      <DocviaContent nodes={page.content} registry={registry} />
    </article>
  );
}
```

> **Interactive components.** Pages that use `:::component` directives ship a
> hydration `manifest` on `page.manifest`. Render the islands on the client by
> passing it to a hydrator — see the `DocviaHydrator` component in this demo.

## 7. Run it

```bash
npm run dev
```

`withDocvia` compiles `docs/` on startup and watches it for changes — no
separate build command needed. Visit `http://localhost:3000/docs` to see your
page. A production build runs the same compilation via `npm run build`.

## Project structure

| Path | Purpose |
| --- | --- |
| `docs/` | Markdown source files |
| `.docvia/` | Generated module graph (gitignore this) |
| `docvia.config.ts` | Docvia configuration |
| `docvia-env.d.ts` | TypeScript module declarations |
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
| `draft` | `boolean` | No | Exclude from production builds |

You can extend these with custom fields via a Zod schema in your config. See
[Configuration](/docs/configuration) for details.
</content>
