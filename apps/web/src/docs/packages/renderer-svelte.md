---
title: "@docvia/renderer-svelte"
description: "The Svelte 5 adapter for docvia — a build-time renderer and a recursive runes-based component that renders the content tree."
eyebrow: "Packages"
order: 22
---

`@docvia/renderer-svelte` is the Svelte 5 adapter for docvia. It pairs a **build-time `RendererAdapter`** that compiles IR documents into JS modules with a **recursive `Renderer.svelte` component** that renders the resulting `RenderOutput` tree at runtime.

It is built on `@docvia/renderer-core` and uses Svelte 5 runes throughout. Dependencies: `svelte ^5`, `@docvia/ir`, and `@docvia/renderer-core`.

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
| `./node` | Build / SSR — `docvia.config.ts` | The build/SSR entry. Exports the adapter and the Vite plugin helpers — **no `.svelte` component**. This is the entry `docvia.config.ts` imports. |

```ts
// docvia.config.ts — build-time
import {
  createSvelteRenderer,
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
  registry?: ComponentRegistry;
}): RendererAdapter;
```

Creates the build-time Svelte `RendererAdapter` (`name: "svelte"`). Its `renderPage` method walks an `IRDocument` through `createDefaultRendererMap()` and emits a JS module exporting `meta`, `content`, and `manifest`. Its `renderManifest` method returns a JSON string describing all pages.

If no `registry` is supplied, an empty one is used.

Syntax highlighting is **not** a renderer option. It is a build-time plugin —
add [`@docvia/plugin-shiki`](/packages/plugin-shiki) to `plugins` in your
docvia config, and the highlighted HTML is baked into the IR before the
renderer ever runs.

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

A Vite plugin (`name: "docvia"`) that resolves `virtual:docvia/<slug>` imports to the compiled page module held in `store`.

> [!IMPORTANT]
> This is a **standalone, low-level plugin**, and it is *not* the one `docvia()`
> from `@docvia/plugin-vite` installs. It only resolves per-page modules for
> slugs you have put into an `InMemoryStore` yourself; if you have not built and
> populated that store, `virtual:docvia/<slug>` will not resolve.
>
> In a normal app you do not use this. Load pages through the collection instead
> — see [Usage](#usage) below.

### invalidateModules()

```ts
function invalidateModules(slugs: string[], server: any): void;
```

Tells the Vite dev server to invalidate the virtual modules for the given slugs and pushes a `js-update` HMR event for each. Call it after recompiling changed documents so the browser hot-reloads them.

## Hydration

`@docvia/renderer-svelte` does **not** export a Svelte-specific `hydrate()` function. The generic island hydrator in `@docvia/renderer-core` is built for the Svelte component instantiation API (`new Component({ target, props, hydrate: true })`), so use it directly:

```ts
import { hydrate } from "@docvia/renderer-core";
import { registry } from "virtual:docvia/source";

// `page` came from `docs.getPage(slugs)` in a server load — see Usage below.
// no-ops on the server; honours client:load / client:idle / client:visible
hydrate(page.manifest, registry);
```

`data-hid` is the universal hydration anchor — the `Renderer` component sets it on every `element` and `component` wrapper, and `hydrate()` looks each island up by `[data-hid="<id>"]`.

## Usage

### Wiring the adapter in `docvia.config.ts`

```ts
import { defineConfig } from "@docvia/cli";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createSvelteRenderer(),
  plugins: [shiki({ theme: "github-dark" })],
});
```

### Rendering a page in a SvelteKit route

Pages are loaded through the collection, in a **server** load — `virtual:docvia/source`
eagerly imports every compiled page, so importing it from a universal `+page.ts`
would ship your whole content set to the browser.

```ts
// src/routes/docs/[...slug]/+page.server.ts
import { docs } from "virtual:docvia/source";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const page = await docs.getPage(params.slug?.split("/") ?? []);
  if (!page) throw error(404, "Page not found");
  return { page };
};
```

The compiled content is a plain JSON tree, so it serializes straight through the
load and into the component:

```svelte
<!-- src/routes/docs/[...slug]/+page.svelte -->
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<article>
  <h1>{data.page.data.title}</h1>
  <Renderer nodes={data.page.content} />
</article>
```

`data.page.data` is the page's frontmatter, including any custom fields your
`frontmatter` schema defines.

### Rendering with a component registry

When you declare `components` in `docvia.config.ts`, docvia generates the registry
for you — import it from the source module rather than hand-rolling one:

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import { registry } from "virtual:docvia/source";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<Renderer nodes={data.page.content} {registry} />
```

To resolve components yourself instead, pass any `ComponentRegistry`:

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/renderer-svelte";
  import type { ComponentRegistry } from "@docvia/renderer-core";
  import Callout from "$lib/Callout.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const registry: ComponentRegistry = {
    resolve(name) {
      if (name === "Callout") return { component: Callout, hydrate: true };
      return null;
    },
  };
</script>

<Renderer nodes={data.page.content} {registry} />
```

### Hydrating islands after mount

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { Renderer } from "@docvia/renderer-svelte";
  import { hydrate } from "@docvia/renderer-core";
  import { registry } from "virtual:docvia/source";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  onMount(() => {
    hydrate(data.page.manifest, registry);
  });
</script>

<Renderer nodes={content} {registry} />
```
