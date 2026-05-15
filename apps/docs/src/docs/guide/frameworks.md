---
title: "Framework integration"
description: "Wire docvia into SvelteKit, Next.js, or a plain Vite app — with a live dev server and a production build."
eyebrow: "Guide"
order: 2
---

`docvia build` only produces a typed module graph in `.docvia/` — it does not
run a server. The `docvia dev` and `docvia preview` commands are standalone
sanity checks, not the way you ship a docs site. To render docs inside a real
app you pair the build step with a framework integration.

The pattern is the same everywhere:

1. Author a `docvia.config.ts` with the renderer that matches your framework.
2. Run `docvia build` **before** the framework's dev/build step.
3. Import compiled pages from `docvia/source` and render them with the
   framework renderer.

This page covers SvelteKit, Next.js, and plain Vite.

## SvelteKit

SvelteKit runs on Vite, so the integration is two Vite plugins from
[`@docvia/plugin-vite`](/packages/plugin-vite) plus a build step.

### 1. Install

```bash
pnpm add -D @docvia/cli @docvia/plugin-vite
pnpm add @docvia/renderer-svelte @docvia/source @docvia/compiler @docvia/renderer-core
```

### 2. Configure docvia

Use the Svelte renderer — note the `/node` subpath, which is the build-time
entry point.

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/cli";
import {
  createShikiHighlighter,
  createSvelteRenderer,
} from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  outDir: ".docvia",
  collections: [{ name: "docs", sourceDir: "src/docs", baseUrl: "/docs" }],
  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({ theme: "github-dark" }),
  }),
});
```

### 3. Wire the Vite plugins

`docviaSourcePlugin()` resolves the `docvia/source` virtual module to the
compiled `.docvia/` artifacts; `docviaMarkdownPlugin()` handles `*.md?docvia`
imports and gives you HMR on Markdown changes through SvelteKit's own dev
server.

```ts
// vite.config.ts
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [
    sveltekit(),
    docviaSourcePlugin(),
    docviaMarkdownPlugin(docviaConfig),
  ],
  build: {
    rollupOptions: {
      external: ["@docvia/source", "@docvia/source/internal"],
    },
  },
});
```

The `external` block is **required** — without it the production `vite build`
fails resolving `@docvia/source`.

### 4. Build before Vite starts

The routes import from `docvia/source`, which only exists after `docvia build`.
A `predev` / `prebuild` hook runs the build automatically:

```jsonc
// package.json
{
  "scripts": {
    "docvia:build": "docvia build",
    "predev": "pnpm docvia:build",
    "dev": "vite dev",
    "prebuild": "pnpm docvia:build",
    "build": "vite build"
  }
}
```

Your workflow is then just `pnpm dev` (live) and `pnpm build` (production) —
docvia builds first in both cases.

### 5. Declare the module types

So `docvia/source` resolves in TypeScript, add a `docvia-env.d.ts` at the
project root:

```ts
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

### 6. Consume pages in a route

A catch-all route loads the page on the server and renders it with the
`Renderer` component from `@docvia/renderer-svelte`.

```ts
// src/routes/docs/[...slug]/+page.server.ts
import { error } from "@sveltejs/kit";
import { docs } from "docvia/source";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const page = await docs.getPage(params.slug ? params.slug.split("/") : []);
  if (!page) throw error(404, "Page not found");
  return { page };
};
```

```svelte
<!-- src/routes/docs/[...slug]/+page.svelte -->
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

Build the sidebar from `docs.pageTree` and you have a fully docvia-driven docs
section. The [`apps/docs`](https://github.com/kanakkholwal/docvia/tree/main/apps/docs)
app in this repository is a complete working example — it dogfoods docvia for
its own documentation.

## Next.js

For Next.js, [`@docvia/plugin-next`](/packages/plugin-next) does the wiring: it
compiles the docs when the Next config is evaluated and aliases
`docvia/source` to the compiled output.

### 1. Install

```bash
pnpm add -D @docvia/cli @docvia/plugin-next
pnpm add @docvia/renderer-react @docvia/source react react-dom
```

### 2. Configure docvia

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/cli";
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({ theme: "github-dark" }),
  }),
});
```

### 3. Wrap the Next config

```js
// next.config.mjs
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia({ configPath: "./docvia.config.ts" })({
  reactStrictMode: true,
});
```

`withDocvia` compiles the docs on config evaluation, aliases `docvia/source`
and `docvia/registry` to the compiled `.docvia/` files in webpack, and in dev
starts an incremental `chokidar` watcher. A cross-process lock
(`.docvia-build.lock`) keeps concurrent Next.js workers from compiling at once.

### 4. Consume pages in a route

```tsx
// app/docs/[[...slug]]/page.tsx
import { docviaSource } from "docvia/source";
import { DocviaContent } from "@docvia/renderer-react";

export function generateStaticParams() {
  return docviaSource.collections.docs.generateParams("slug");
}

export default async function DocPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const page = await docviaSource.collections.docs.getPage(params.slug);
  if (!page) return null;
  return <DocviaContent nodes={page.content} />;
}
```

`DocviaContent` carries no `"use client"` directive, so it renders as a React
Server Component. For interactive component islands, hydrate them on the client
with `hydrate` from `@docvia/renderer-react/client`.

## Plain Vite (React or Svelte)

Without SvelteKit or Next.js, use the same two `@docvia/plugin-vite` plugins
directly in `vite.config.ts`:

```ts
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import docviaConfig from "./docvia.config";

export default {
  plugins: [docviaSourcePlugin(), docviaMarkdownPlugin(docviaConfig)],
};
```

Then import a page directly through the markdown plugin:

```ts
import page from "./docs/index.md?docvia";
```

Add the `docvia build` `predev`/`prebuild` hooks exactly as in the SvelteKit
section so `docvia/source` exists before Vite starts.

## Standalone preview

`docvia preview` serves the raw `.docvia/` output over `sirv`:

```bash
docvia preview --out .docvia --port 4173
```

This is a sanity check for the compiled module graph — it is **not** a runtime.
For an actual site, use one of the framework integrations above.

## Choosing an approach

| Your app | Integration | Renderer |
|---|---|---|
| SvelteKit | `@docvia/plugin-vite` | `@docvia/renderer-svelte` |
| Next.js | `@docvia/plugin-next` | `@docvia/renderer-react` |
| Plain Vite (Svelte) | `@docvia/plugin-vite` | `@docvia/renderer-svelte` |
| Plain Vite (React) | `@docvia/plugin-vite` | `@docvia/renderer-react` |
| Any other framework | run `docvia build` in a script | write a `RendererAdapter` |
