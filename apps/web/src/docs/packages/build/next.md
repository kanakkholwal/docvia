---
title: "@docvia/build/next"
description: "Next.js integration: compiles defineDocs() collections and Markdown pages for webpack and Turbopack."
eyebrow: "Packages"
order: 5
---

`@docvia/build/next` integrates docvia with Next.js. `withDocvia()` wraps your `next.config` and registers two loaders for **both webpack and Turbopack**: one rewrites `defineDocs()` / `defineRegistry()` calls into an index of your pages, the other compiles each Markdown page lazily when `page.data.load()` first imports it. No `.docvia/` folder is written.

## Install

```bash
pnpm add -D @docvia/build
pnpm add @docvia/core
```

Next.js is a peer dependency: `next >= 14`. The generated code imports `@docvia/core/source`, so install it in your app.

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `withDocvia`, `defineConfig`, `DocviaNextOptions`. |
| `./loader` | The `.md?docvia` loader. |
| `./macro-loader` | The `defineDocs()` / `defineRegistry()` loader. |
| `./package.json` | Package metadata. |

Import `defineConfig` from here in `docvia.config.ts`.

## API reference

### `interface DocviaNextOptions`

```ts
interface DocviaNextOptions {
  configPath?: string;
  macroFiles?: string[];
}
```

| Field | Type | Default | Meaning |
|---|---|---|---|
| `configPath` | `string` | `"./docvia.config.ts"` | Path to the docvia config file. |
| `macroFiles` | `string[]` | `source.{ts,tsx,js,mjs}`, `registry.{ts,tsx,js}` | File names that may call `defineDocs()` / `defineRegistry()`. |

Only files with these names are transformed (Turbopack matches rules by file name). A macro call in any other file throws at runtime.

### `withDocvia`

```ts
function withDocvia(
  options?: DocviaNextOptions,
): (nextConfig?: NextConfig) => (phase: string, context: unknown) => Promise<NextConfig>;
```

A curried wrapper for `next.config`. Calling `withDocvia()` returns a function that takes your existing `NextConfig` (or a config function); that returns the async `(phase, context)` function Next.js expects.

The returned config adds:

- **Macro loader.** A `pre` webpack rule (before SWC) and a `turbopack.rules` entry per name in `macroFiles`.
- **Markdown loader.** A `.md?docvia` webpack rule and a `*.md` Turbopack rule. Each page compiles in memory on first import, keyed by content hash.

An existing `webpack()` hook or `turbopack` block on your config is preserved and composed.

## Usage

### `next.config.ts`

```ts title="next.config.ts"
import { withDocvia } from "@docvia/build/next";

export default withDocvia()({ reactStrictMode: true });
```

### Declare the collection

```ts title="lib/source.ts"
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

```ts title="lib/registry.ts"
import { defineRegistry } from "@docvia/core/source/macro";

export const registry = defineRegistry();
```

### Render a page

```tsx title="app/docs/[[...slug]]/page.tsx"
import { Renderer } from "@docvia/core/react";
import { notFound } from "next/navigation";
import { registry } from "@/lib/registry";
import { source } from "@/lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const { content } = await page.data.load();
  return <Renderer nodes={content} registry={registry} />;
}
```

### Custom file names

```ts
export default withDocvia({ macroFiles: ["docs-source.ts", "registry.ts"] })();
```

> **Legacy config collections.** When `docvia.config.ts` declares `collections` (or no macro file exists), `withDocvia()` instead compiles everything up front into `.docvia/` under a cross-process lock, watches it in dev, and aliases `docvia/source`, `docvia/source/browser` and `docvia/registry` to it.
