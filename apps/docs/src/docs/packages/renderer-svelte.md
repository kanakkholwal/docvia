---
title: "@docvia/renderer-svelte"
description: "The Svelte 5 adapter for docvia — a build-time renderer and a recursive runes-based component that renders the content tree."
eyebrow: "Packages"
order: 22
---

`@docvia/renderer-svelte` is the Svelte 5 adapter for docvia. It pairs a **build-time `RendererAdapter`** that compiles IR documents into JS modules with a **recursive `Renderer.svelte` component** that renders the resulting `RenderOutput` tree at runtime.

It is built on `@docvia/renderer-core` and uses Svelte 5 runes throughout. Dependencies: `svelte ^5`, `shiki`, `@docvia/ir`, and `@docvia/renderer-core`.

## Architecture

docvia rendering happens in two phases:

1. **Build time** — `createSvelteRenderer()` produces a `RendererAdapter`. docvia calls it per document; it walks the IR through `renderer-core` and emits a JS module exporting `meta`, `content`, and `manifest`.
2. **Runtime** — your Svelte route imports that module and passes `content` to the `Renderer` component, which recursively walks the tree.

The package ships two entry points so the build pipeline never has to compile a `.svelte` file and your app always compiles it through your Svelte toolchain.

## Installation

```bash
npm install @docvia/renderer-svelte
```

`svelte ^5` must be present in your project — the `Renderer` component relies on runes (`$props`, `$derived`).

## Exports

There are two entry points. Choosing the right one matters because one ships a `.svelte` source file and one does not.

| Subpath | Environment | Purpose |
| --- | --- | --- |
| `.` | App routes / browser | Exports the `Renderer` component **and** everything from the adapter module. Uses package export *conditions*: the `svelte` condition resolves to the raw `./src/index.ts` source so a Svelte-aware bundler compiles the `.svelte` component itself; `import`/`default` resolve to the prebuilt `./dist/index.js`. |
| `./node` | Build / SSR — `docvia.config.ts` | The build/SSR entry. Exports the adapter, the shiki highlighter factory, and the Vite plugin helpers — **no `.svelte` component**. This is the entry `docvia.config.ts` imports. |

```ts
// docvia.config.ts — build-time
import {
  createSvelteRenderer,
  createShikiHighlighter,
  createInMemoryStore,
  docviaVitePlugin,
  invalidateModules,
} from "@docvia/renderer-svelte/node";
```

```svelte
<!-- app route — runtime -->
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
</script>
```

> Import the adapter from `@docvia/renderer-svelte/node` in `docvia.config.ts`, and import the `Renderer` component from `@docvia/renderer-svelte` in your app routes. Pointing the config at the root entry would pull a `.svelte` source file into the build pipeline.

## Compiled page modules

Every page module emitted by the adapter exports the same three named bindings:

```ts
export const meta;     // PageMeta
export const content;  // RenderOutput — a fragment
export const manifest; // HydrationManifest
```

`content` feeds the `Renderer` component, `manifest` feeds island hydration, and `meta` carries the page's title, description, headings, tags, order, and content hash.

## Component reference

### Renderer

`Renderer` (the `Renderer.svelte` component, exported under that name) is a **recursive Svelte 5 component** that renders a serialized `RenderOutput` tree.

#### Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `RenderOutput \| RenderOutput[]` | Yes | The serialized tree — the `content` export of a compiled page, or any subtree. A single node is normalized to an array internally. |
| `registry` | `ComponentRegistry` | No | Resolves custom directive components by name. |

#### Rendering behaviour

The component renders each node by its `kind`:

| Kind | Rendered as |
| --- | --- |
| `text` | The text value, rendered verbatim. |
| `html` | Raw HTML via `{@html …}`. |
| `element` | A `<svelte:element this={tag}>` with the node's `props` spread on, and `data-hid` set from the node's `id`. Children recurse through `Renderer`. |
| `component` | The name is resolved through `registry`. The resolved component is wrapped in `<div data-hid={id} class="docvia-component-wrapper">` and rendered with the node's props. Children recurse through `Renderer`. An unresolved name renders a `docvia-error` div. |
| `fragment` | Children recurse transparently through `Renderer`. |

Because the component recurses into itself for `element`, `component`, and `fragment` children, a single `<Renderer>` at the route level renders the whole document.

## API reference

### createSvelteRenderer()

```ts
function createSvelteRenderer(options?: {
  highlighter?: SyntaxHighlighter;
  registry?: ComponentRegistry;
}): RendererAdapter;
```

Creates the build-time Svelte `RendererAdapter` (`name: "svelte"`). Its `renderPage` method walks an `IRDocument` through `createDefaultRendererMap()` and emits a JS module exporting `meta`, `content`, and `manifest`. Its `renderManifest` method returns a JSON string describing all pages.

If no `highlighter` is supplied, a default `createShikiHighlighter()` is used. If no `registry` is supplied, an empty one is used.

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
| `langs` | `["javascript", "typescript", "bash", "json", "css", "html", "svelte"]` |

The shiki instance is created on first highlight and reused for all later calls. If a highlight call throws (e.g. an unregistered language), it falls back to an escaped `<pre><code>` block.

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

A Vite plugin (`name: "docvia"`) that resolves `virtual:docvia/<slug>` imports to the compiled page module held in `store`. App routes can then import a page as `import { content, manifest } from "virtual:docvia/getting-started"`.

### invalidateModules()

```ts
function invalidateModules(slugs: string[], server: any): void;
```

Tells the Vite dev server to invalidate the virtual modules for the given slugs and pushes a `js-update` HMR event for each. Call it after recompiling changed documents so the browser hot-reloads them.

## Hydration

`@docvia/renderer-svelte` does **not** export a Svelte-specific `hydrate()` function. The generic island hydrator in `@docvia/renderer-core` is built for the Svelte component instantiation API (`new Component({ target, props, hydrate: true })`), so use it directly:

```ts
import { hydrate } from "@docvia/renderer-core";
import { manifest } from "virtual:docvia/getting-started";
import { registry } from "./docvia-registry";

// no-ops on the server; honours client:load / client:idle / client:visible
hydrate(manifest, registry);
```

`data-hid` is the universal hydration anchor — the `Renderer` component sets it on every `element` and `component` wrapper, and `hydrate()` looks each island up by `[data-hid="<id>"]`.

## Usage

### Wiring the adapter in `docvia.config.ts`

```ts
import { defineConfig } from "@docvia/core";
import {
  createSvelteRenderer,
  createShikiHighlighter,
} from "@docvia/renderer-svelte/node";

export default defineConfig({
  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({ theme: "github-dark" }),
  }),
});
```

### Rendering a page in a Svelte route

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import { content, meta } from "virtual:docvia/getting-started";
</script>

<article>
  <h1>{meta.title}</h1>
  <Renderer nodes={content} />
</article>
```

### Rendering with a component registry

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import type { ComponentRegistry } from "@docvia/renderer-core";
  import { content } from "virtual:docvia/getting-started";
  import Callout from "$lib/Callout.svelte";

  const registry: ComponentRegistry = {
    resolve(name) {
      if (name === "Callout") return { component: Callout, hydrate: true };
      return null;
    },
  };
</script>

<Renderer nodes={content} {registry} />
```

### Hydrating islands after mount

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { Renderer } from "@docvia/renderer-svelte";
  import { hydrate } from "@docvia/renderer-core";
  import { content, manifest } from "virtual:docvia/getting-started";
  import { registry } from "$lib/docvia-registry";

  onMount(() => {
    hydrate(manifest, registry);
  });
</script>

<Renderer nodes={content} {registry} />
```
