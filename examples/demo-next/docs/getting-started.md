---
title: Getting Started
description: Set up docvia with Next.js App Router
tags: [guide, setup]
order: 1
---

# Getting Started

Get docvia running with Next.js in three steps.

## 1. Install

```bash
pnpm add -D @docvia/cli @docvia/renderer-react @docvia/source next react react-dom
```

## 2. Configure

Create `docvia.config.ts` in your project root:

```typescript
import { defineConfig } from '@docvia/cli';
import { createReactRenderer, createShikiHighlighter } from '@docvia/renderer-react';

export default defineConfig({
    sourceDir: 'docs',
    outDir: '.docvia',
    renderer: createReactRenderer({
        highlighter: createShikiHighlighter({ theme: 'github-dark' }),
    }),
});
```

Create `next.config.ts`:

```typescript
import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            'docvia:source': path.resolve('.docvia/source.ts'),
            'docvia:source/registry': path.resolve('.docvia/registry.ts'),
        };
        return config;
    },
    experimental: {
        turbo: {
            resolveAlias: {
                'docvia:source': './.docvia/source.ts',
                'docvia:source/registry': './.docvia/registry.ts',
            },
        },
    },
};

export default nextConfig;
```

## 3. Create Your Page

Build docs and start Next.js:

```bash
pnpm docvia build && next dev
```

Create `app/docs/[[...slug]]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { docs } from 'docvia:source';
import { DocviaContent } from '@docvia/renderer-react';

export async function generateStaticParams() {
    return docs.getAllPages().map(slug => ({
        slug: slug === 'index' ? [] : slug.split('/'),
    }));
}

export default async function DocPage({ params }) {
    const { slug } = await params;
    const page = await docs.getPage(slug ?? []);
    if (!page) notFound();

    return (
        <article className="prose">
            <DocviaContent
                nodes={page.content}
                components={{ a: Link }}
            />
        </article>
    );
}
```

## Project Structure

| Path | Purpose |
|---|---|
| `docs/` | Markdown source files |
| `docvia.config.ts` | Renderer and component config |
| `next.config.ts` | Webpack alias for `docvia:source` |
| `.docvia/` | Compiled output (gitignored) |
| `app/docs/[[...slug]]/page.tsx` | Catch-all doc page |

## Frontmatter Fields

```yaml
---
title: Page Title          # required
description: Brief summary # used in <meta> and previews
tags: [guide, api]         # for tag-based grouping
order: 1                   # controls navigation sort order
slug: custom-url           # override auto-generated slug
---
```

## Development Workflow

Watch docs and Next.js simultaneously:

```bash
pnpm dev
```

`docvia dev` watches markdown files and recompiles on change. Next.js HMR picks up the updated `.docvia/` files automatically.
