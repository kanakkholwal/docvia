---
title: "@docvia/renderer-react"
description: "The React adapter for docvia — a build-time renderer, an RSC-safe content component, and a browser-only island hydrator."
eyebrow: "Packages"
order: 21
---

`@docvia/renderer-react` is the React adapter for docvia. It wires `@docvia/renderer-core` into a React application across three roles: a **build-time `RendererAdapter`** that compiles IR documents into JS modules, a **`DocviaContent` component** that renders the resulting tree, and a **browser-only `hydrate()`** function that activates interactive islands.

The package is carefully split into two entry points so it works seamlessly in React Server Components, classic SSR, and the browser. It targets **React 19** (`react` and `react-dom` are peer dependencies, `>=19`).

## Architecture

docvia rendering happens in two phases:

1. **Build time** — `createReactRenderer()` produces a `RendererAdapter`. docvia calls it for each document; it walks the IR through `renderer-core` and emits a JS module exporting `meta`, `content`, and `manifest`.
2. **Runtime** — your app imports that module and passes `content` to `<DocviaContent>`. Interactive components are then hydrated in the browser via the `./client` entry.

The key design point: **`DocviaContent` contains no `"use client"` directive and uses no hooks or browser APIs.** It renders identically as a React Server Component, under SSR (`renderToString`), and in the browser. Anything that touches `react-dom/client` lives exclusively in the separate `./client` entry.

## Installation

```bash
npm install @docvia/renderer-react
```

```jsonc
// peer dependencies
{
  "react": ">=19",
  "react-dom": ">=19"
}
```

## Exports

The package has two entry points with a strict server/browser boundary.

| Subpath | Environment | Purpose |
| --- | --- | --- |
| `.` | RSC, SSR, and browser — **server-safe** | The build-time adapter (`createReactRenderer`), the shiki highlighter factory, the Vite virtual-module plugin, the in-memory store helpers, and the `DocviaContent` component. Safe everywhere except hydration. Does **not** import `react-dom/client`. |
| `./client` | **Browser only** | The island hydrator. Imports `react-dom/client` (`hydrateRoot`, `createRoot`). Exports `hydrate` and `HydrateOptions`. Must never be imported in an RSC or a Node SSR path. |

```ts
// server-safe — RSC / SSR / build / client bundles
import {
  createReactRenderer,
  createShikiHighlighter,
  createInMemoryStore,
  docviaVitePlugin,
  invalidateModules,
  DocviaContent,
  type DocviaContentProps,
  type DocviaComponents,
  type CodeBlockOverrideProps,
  type InMemoryStore,
} from "@docvia/renderer-react";

// browser only — island hydration
import { hydrate, type HydrateOptions } from "@docvia/renderer-react/client";
```

> Importing `@docvia/renderer-react/client` inside a React Server Component will fail the Next.js build, because `react-dom/client` cannot land in the RSC bundle. Keep hydration in a `"use client"` component.

## Compiled page modules

Every page module emitted by the adapter exports the same three named bindings:

```ts
export const meta;     // PageMeta
export const content;  // RenderOutput — a fragment
export const manifest; // HydrationManifest
```

`content` feeds `<DocviaContent>`, `manifest` feeds `hydrate()`, and `meta` carries the page's title, description, headings, tags, order, and content hash.

## Component reference

### DocviaContent

```ts
function DocviaContent(props: DocviaContentProps): React.ReactElement;
```

Renders a docvia `RenderOutput` tree into React elements. It is a plain component with no hooks — safe as an RSC, under SSR, and in the browser.

#### Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `RenderOutput \| RenderOutput[]` | Yes | The serialized tree (the `content` export of a compiled page, or any subtree). |
| `registry` | `ComponentRegistry` | No | Resolves custom directive components by name. |
| `components` | `DocviaComponents` | No | Tag-level and semantic component overrides. |

#### Rendering behaviour

- **`text`** → rendered verbatim.
- **`html`** → injected via `dangerouslySetInnerHTML` (the value is sanitized upstream).
- **`fragment`** → children rendered transparently.
- **`element`** → mapped to a host element. The `class` prop is renamed to `className`, and `id` becomes `data-hid`.
- **Code-block collapse** — when an element's children are all `html` nodes, they are merged and injected directly with `dangerouslySetInnerHTML`, avoiding an extra wrapper `<div>` around shiki output.
- **`component`** → resolved through `registry`. The rendered component is wrapped in `<div data-hid={id} className="docvia-component-wrapper">`, which is the hydration anchor. An unresolved name renders a `docvia-render-error` placeholder.
- **Tag overrides** — if `components[tag]` exists, that component replaces the host element (e.g. `a` → `next/link`).
- **`codeBlock` override** — if `components.codeBlock` is set, it receives the pre-rendered shiki HTML instead of the default `docvia-code-block` div.

### DocviaContentProps

```ts
interface DocviaContentProps {
  nodes: RenderOutput | RenderOutput[];
  registry?: ComponentRegistry;
  components?: DocviaComponents;
}
```

### DocviaComponents

```ts
interface DocviaComponents {
  codeBlock?: React.ComponentType<CodeBlockOverrideProps>;
  a?: React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }
  >;
  img?: React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement>>;
  [tag: string]: React.ComponentType<any> | undefined;
}
```

A fumadocs-inspired override map.

| Slot | Purpose |
| --- | --- |
| `codeBlock` | Overrides the entire code-block render. Receives the pre-rendered shiki HTML — ideal for copy buttons or language tabs. Falls back to a `docvia-code-block` div. |
| `a` | Overrides all anchor tags — typically swapped for `next/link`. |
| `img` | Overrides all images — typically swapped for `next/image`. |
| `[tag]` | Overrides any other HTML tag by name. |

### CodeBlockOverrideProps

```ts
interface CodeBlockOverrideProps {
  html: string;       // pre-rendered syntax-highlighted markup from shiki
  id?: string;        // hydration / anchor id, if the block has one
  className: string;  // always "docvia-code-block"
}
```

## API reference

### createReactRenderer()

```ts
function createReactRenderer(options?: {
  highlighter?: SyntaxHighlighter;
  registry?: ComponentRegistry;
}): RendererAdapter;
```

Creates the build-time React `RendererAdapter` (`name: "react"`). It runs at build time or server-side in dev. Its `renderPage` method walks an `IRDocument` through `createDefaultRendererMap()` and emits a JS module exporting `meta`, `content`, and `manifest`. Its `renderManifest` method returns a JSON string describing all pages.

If no `highlighter` is supplied, a default `createShikiHighlighter()` is used. If no `registry` is supplied, an empty one (`resolve: () => null`) is used.

### createShikiHighlighter()

```ts
function createShikiHighlighter(opts?: {
  theme?: string;
  langs?: string[];
}): SyntaxHighlighter;
```

Returns a lazy, shiki-backed `SyntaxHighlighter`.

| Option | Default |
| --- | --- |
| `theme` | `"github-dark"` |
| `langs` | `["javascript", "typescript", "bash", "json", "css", "html", "jsx", "tsx"]` |

`shiki` is imported dynamically on first highlight and the instance is cached on `globalThis` (`__docvia_shiki__`), so concurrent calls share a single highlighter. If a highlight call throws (e.g. an unregistered language), it falls back to an escaped `<pre><code>` block.

### createInMemoryStore()

```ts
function createInMemoryStore(): InMemoryStore;
```

Creates a `Map`-backed store of compiled pages, keyed by slug.

```ts
interface InMemoryStore {
  get(slug: string): RenderedPage | undefined;
  set(slug: string, page: RenderedPage): void;
  entries(): IterableIterator<[string, RenderedPage]>;
}
```

### docviaVitePlugin()

```ts
function docviaVitePlugin(store: InMemoryStore): Plugin;
```

A Vite plugin (`name: "docvia-react"`) that resolves `virtual:docvia/<slug>` imports to the compiled page module held in `store`. This lets app routes import a page as `import { content, manifest } from "virtual:docvia/getting-started"`.

### invalidateModules()

```ts
function invalidateModules(slugs: string[], server: any): void;
```

Tells the Vite dev server to invalidate the virtual modules for the given slugs and pushes a `js-update` HMR event for each. Call it after recompiling changed documents so the browser hot-reloads them.

## Client API reference

### hydrate()

```ts
function hydrate(
  manifest: HydrationManifest,
  registry: ComponentRegistry,
  options?: HydrateOptions,
): void;
```

Hydrates interactive component islands listed in the manifest. Each entry's `hydrate` mode controls timing:

- `client:load` — mount immediately.
- `client:idle` — mount on `requestIdleCallback` (or a `setTimeout(…, 200)` fallback).
- `client:visible` — mount when the `[data-hid]` anchor enters the viewport via `IntersectionObserver`.

Each island is mounted at its `[data-hid]` element. The function is **idempotent** — every hydrated id is tracked, so repeated calls never double-mount. Missing anchors and unresolved components log a warning/error and are skipped.

### HydrateOptions

```ts
interface HydrateOptions {
  ssr?: boolean;
}
```

| Field | Default | Behaviour |
| --- | --- | --- |
| `ssr` | `false` | When `true`, the island was server-rendered — React calls `hydrateRoot(el, element)` to attach handlers to existing DOM. When `false`, it calls `createRoot(el).render(element)` for a fresh client-only render (Vite SPA). |

## Usage

### Wiring the adapter in `docvia.config.ts`

```ts
import { defineConfig } from "@docvia/core";
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

export default defineConfig({
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({ theme: "github-dark" }),
  }),
});
```

### Rendering a page (RSC / Next.js App Router)

```tsx
// app/docs/[slug]/page.tsx — a Server Component, no "use client"
import { DocviaContent } from "@docvia/renderer-react";
import { content, meta } from "virtual:docvia/getting-started";

export default function DocPage() {
  return (
    <article>
      <h1>{meta.title}</h1>
      <DocviaContent nodes={content} />
    </article>
  );
}
```

### Tag and code-block overrides

```tsx
import { DocviaContent, type DocviaComponents } from "@docvia/renderer-react";
import Link from "next/link";
import Image from "next/image";
import { content } from "virtual:docvia/getting-started";

const components: DocviaComponents = {
  a: (props) => <Link href={props.href ?? "#"} {...props} />,
  img: (props) => <Image {...props} alt={props.alt ?? ""} />,
  codeBlock: ({ html, className }) => (
    <div className={className}>
      <button>Copy</button>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  ),
};

export function Doc() {
  return <DocviaContent nodes={content} components={components} />;
}
```

### Hydrating interactive islands

```tsx
"use client";

import { useEffect } from "react";
import { hydrate } from "@docvia/renderer-react/client";
import { manifest } from "virtual:docvia/getting-started";
import { registry } from "../docvia-registry";

export function DocviaHydrator() {
  useEffect(() => {
    // ssr: true for server-rendered pages (App Router / Pages Router)
    hydrate(manifest, registry, { ssr: true });
  }, []);
  return null;
}
```

For a Vite SPA with no server render, call it directly with `{ ssr: false }`:

```ts
import { hydrate } from "@docvia/renderer-react/client";
import { manifest } from "virtual:docvia/getting-started";
import { registry } from "./docvia-registry";

hydrate(manifest, registry, { ssr: false });
```
