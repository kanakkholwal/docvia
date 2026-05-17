---
title: Introduction
description: Docvia is a compiler-grade documentation framework that transforms Markdown into type-safe, framework-optimized output.
order: 0
---

# Introduction

Docvia is a documentation framework built on a compiler architecture. It parses Markdown into an Intermediate Representation (IR), then renders framework-optimized output for React, Svelte, or any target.

## How it works

```
Markdown → Parser → IR → Renderer → Framework Output
```

1. **Parse** — Micromark parses your `.md` files into an AST
2. **Transform** — The IR layer converts the AST into framework-agnostic nodes
3. **Render** — A renderer adapter (React, Svelte) produces serialized output
4. **Deliver** — Your framework renders the output with full SSR support

All heavy work happens at build time. At runtime, your pages are pre-compiled JSON trees — no markdown parsing, no syntax highlighting overhead.

## Why Docvia

- **Type-safe** — Generated TypeScript types for routes and frontmatter
- **Framework-native** — React Server Components, SvelteKit SSR, not framework-agnostic wrappers
- **Build-time compilation** — Shiki syntax highlighting, IR transforms, and rendering happen once
- **Interactive islands** — Embed React/Svelte components in Markdown with selective hydration
- **Zero client JS by default** — Only interactive components ship JavaScript

## Quick start

```bash
npm install -D @docvia/cli @docvia/plugin-next @docvia/plugin-shiki
npm install @docvia/renderer-react @docvia/source
```

```bash
npx docvia init
```

`docvia init` scaffolds a `docvia.config.ts` and sample docs. Wrap your Next
config with `withDocvia` — see [Getting Started](/docs/getting-started) — then
import and render pages in your Next.js routes:

```tsx
import { docs } from "docvia/source";

const page = await docs.getPage(["getting-started"]);
```

## Next steps

- [Getting Started](/docs/getting-started) — Set up Docvia with Next.js
- [Source API](/docs/source-api) — Work with pages, navigation, and routes
- [Rendering](/docs/rendering) — Render content with component overrides
