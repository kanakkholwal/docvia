---
title: Welcome to docvia
description: Fast, modern documentation with docvia and Next.js SSR
tags: [getting-started]
---

# Welcome to docvia

Fast, modern documentation powered by docvia — compiled at build time, rendered server-side by Next.js, zero runtime markdown overhead.

## Why docvia + Next.js?

- **Server Components** — `DocviaContent` is an RSC by default, zero client JS for static pages
- **Build-time compilation** — Markdown compiled to a typed `RenderOutput` tree before the server starts
- **`next/link` integration** — Pass `components={{ a: Link }}` for instant client-side navigation
- **Interactive islands** — React components embedded in markdown via the directive syntax
- **Full-text search** — Powered by Orama, built at compile time

## Quick Start

Add docvia to your Next.js project:

```bash
pnpm add -D @docvia/cli @docvia/renderer-react @docvia/source
```

Build your docs:

```bash
pnpm docvia build
```

Start the dev server:

```bash
next dev --turbopack
```

## How SSR Works

1. `docvia build` compiles all Markdown files into typed `RenderOutput` trees (with shiki syntax highlighting)
2. The `.docvia/` directory holds metadata, navigation, and the compiled source module
3. Next.js App Router imports `docvia:source` via a webpack alias → resolves to `.docvia/source.ts`
4. `docs.getPage(slug)` loads the page module — on the server, this renders from the compiled output
5. `<DocviaContent nodes={page.content} />` renders the tree as React elements server-side

## What's Next?

- [Getting Started](./getting-started) — full setup walkthrough
- [Components](./components) — interactive component islands in markdown
