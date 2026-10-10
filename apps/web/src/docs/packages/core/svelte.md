---
title: "@docvia/core/svelte"
description: "The Svelte 5 adapter for docvia: a build-time renderer and a recursive runes-based component that renders the content tree."
eyebrow: "Packages"
order: 10
---

`@docvia/core/svelte` is the Svelte 5 adapter for docvia. It pairs a **build-time `RendererAdapter`** that compiles IR documents into JS modules with a **recursive `Renderer.svelte` component** that renders the resulting `RenderOutput` tree at runtime.

It is built on `createModuleRenderer` from `@docvia/core/render` and uses Svelte 5 runes throughout. Dependencies: `@docvia/core` and `@docvia/core/render`; `svelte ^5` is a peer dependency.

## Architecture

docvia rendering happens in two phases:

1. **Build time.** `createSvelteRenderer()` produces a `RendererAdapter`. docvia calls it per document; it walks the IR through `renderer-core` and emits a JS module exporting `meta`, `content`, and `manifest`.
2. **Runtime.** Your Svelte route imports that module and passes `content` to the `Renderer` component, which recursively walks the tree.

The package ships two entry points so the build pipeline never has to compile a `.svelte` file and your app always compiles it through your Svelte toolchain.

## Installation

```bash
npm install @docvia/core
```

`svelte ^5` is a peer dependency and must be present in your project, because the `Renderer` component relies on runes (`$props`, `$derived`).

## Exports

There are two entry points. Choosing the right one matters because one ships a `.svelte` source file and one does not.

| Subpath | Environment | Purpose |
| --- | --- | --- |
| `.` | App routes / browser | Exports the `Renderer` component and the `RenderOutput`, `ComponentRegistry`, and `HydrationManifest` types. The `svelte` and `default` conditions both point at `./dist/index.js`; the packaged `.svelte` component is compiled by your Svelte toolchain. |
| `./node` | Build / SSR (`docvia.config.ts`) | The build-time entry. Exports `createSvelteRenderer` and its option types, with **no `.svelte` component**. This is the entry `docvia.config.ts` imports. |
| `./package.json` | Tooling | Package metadata. |

```ts
// docvia.config.ts: build-time
import { createSvelteRenderer } from "@docvia/core/svelte/node";
```

```svelte
<!-- app route: runtime -->
<script lang="ts">
  import { Renderer } from "@docvia/core/svelte";
</script>
```

> Import the adapter from `@docvia/core/svelte/node` in `docvia.config.ts`, and import the `Renderer` component from `@docvia/core/svelte` in your app routes. Pointing the config at the root entry would pull a `.svelte` source file into the build pipeline.

## Compiled page modules

Every page module emitted by the adapter exports the same three named bindings:

```ts
export const meta;     // PageMeta
export const content;  // RenderOutput (a fragment)
export const manifest; // HydrationManifest
```

`content` feeds the `Renderer` component, `manifest` feeds island hydration, and `meta` carries the page's title, description, headings, tags, order, and content hash.

## Component reference

### Renderer

`Renderer` renders a serialized `RenderOutput` tree. It has the same name and props as the [React `Renderer`](/docs/packages/core/react#renderer), so a page reads the same in either framework.

#### Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | `RenderOutput \| RenderOutput[]` | Yes | The serialized tree: the `content` export of a compiled page, or any subtree. A single node is normalized to an array internally. |
| `registry` | `ComponentRegistry` | No | Resolves custom directive components by name. |
| `components` | `RendererComponents` | No | Tag overrides (`{ a: Link }`) and a `codeBlock` slot, same contract as React. |

#### Rendering behaviour

The component renders each node by its `kind`:

| Kind | Rendered as |
| --- | --- |
| `text` | The text value, rendered verbatim. |
| `html` | Raw HTML via `{@html …}`. |
| `element` | `components[tag]` if set, otherwise a `<svelte:element this={tag}>` with the node's `props` spread on and `data-hid` set from the node's `id`. A code block goes to `components.codeBlock` when set. |
| `component` | The name is resolved through `registry`. The resolved component is wrapped in `<div data-hid={id} class="docvia-component-wrapper">` and rendered with the node's props. An unresolved name renders a `docvia-render-error` div. |
| `fragment` | Children render transparently. |

A single `<Renderer>` at the route level renders the whole document.

```svelte
<Renderer nodes={data.content} {registry} components={{ codeBlock: CodeBlock }} />
```

Tag overrides apply to `a`, `img` and code blocks, which the build keeps as nodes. Other tags are pre-rendered to HTML for speed; list them in `createSvelteRenderer({ staticHtml: { keepTags: ["table"] } })` to override them too.

On mount it calls, once per page, `installCodeGroups()` and `installCopyButtons()` from `@docvia/core/render/client`, so code-group tabs switch and code-block copy buttons work with no extra setup.

## API reference

### createSvelteRenderer()

```ts
function createSvelteRenderer(options?: {
  registry?: ComponentRegistry;
  transform?: (output: RenderOutput, doc: IRDocument) => RenderOutput | Promise<RenderOutput>;
}): RendererAdapter;
```

Creates the build-time Svelte `RendererAdapter` (`name: "svelte"`) via `createModuleRenderer` from `@docvia/core/render`. Its `renderPage` method walks an `IRDocument` through `createDefaultRendererMap()` and emits a JS module exporting `meta`, `content`, and `manifest`. Its `renderManifest` method returns a JSON string describing all pages.

If no `registry` is supplied, an empty one is used. `transform` rewrites each page's `RenderOutput` tree before it is serialized:

```ts
createSvelteRenderer({
  transform: (output, doc) => output, // return a rewritten tree
});
```

Syntax highlighting is **not** a renderer option. It is a build-time plugin:
add [`@docvia/plugin-shiki`](/docs/packages/plugin-shiki) to `plugins` in your
docvia config, and the highlighted HTML is baked into the IR before the
renderer ever runs.

## Hydration

`@docvia/core/svelte` does **not** export a Svelte-specific `hydrate()` function. The generic island hydrator in `@docvia/core/render` is built for the Svelte component instantiation API (`new Component({ target, props, hydrate: true })`), so use it directly:

```ts
import { hydrate } from "@docvia/core/render";
import { registry } from "$lib/registry";

// `manifest` comes from `page.data.load()` in a server load; see Usage below.
// no-ops on the server; honours client:load / client:idle / client:visible
hydrate(manifest, registry);
```

`Renderer` also makes tabbed code groups (`role="tablist"`) switch on click; no extra setup is needed.

`data-hid` is the universal hydration anchor. The `Renderer` component sets it on every `element` and `component` wrapper, and `hydrate()` looks each island up by `[data-hid="<id>"]`.

## Usage

### Wiring the adapter in `docvia.config.ts`

```ts
import { defineConfig } from "@docvia/build/vite";
import { createSvelteRenderer } from "@docvia/core/svelte/node";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createSvelteRenderer(),
  plugins: [shiki({ theme: "github-dark" })],
});
```

### Rendering a page in a SvelteKit route

Declare the collection once with `defineDocs()` (see
[`@docvia/core/source`](/docs/packages/core/source)), then load pages in a **server** load:

```ts
// src/routes/docs/[...slug]/+page.server.ts
import { error } from "@sveltejs/kit";
import { source } from "$lib/source";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const page = source.getPage(params.slug?.split("/").filter(Boolean));
  if (!page) error(404, "Page not found");
  const { content, headings, manifest } = await page.data.load();
  return { page: { title: page.data.title, content, headings, manifest } };
};
```

The compiled content is a plain JSON tree, so it serializes straight through the
load and into the component:

```svelte
<!-- src/routes/docs/[...slug]/+page.svelte -->
<script lang="ts">
  import { Renderer } from "@docvia/core/svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<article>
  <h1>{data.page.title}</h1>
  <Renderer nodes={data.page.content} />
</article>
```

`page.data` is the page's frontmatter, including any fields your `defineDocs()`
schema adds. `content` is typed `RenderOutput`, and `headings` is always present,
ready for a table of contents.

### Rendering with a component registry

When you declare `components` in `docvia.config.ts`, `defineRegistry()` builds the
registry for you:

```ts
// src/lib/registry.ts
import { defineRegistry } from "@docvia/core/source/macro";

export const registry = defineRegistry();
```

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/core/svelte";
  import { registry } from "$lib/registry";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<Renderer nodes={data.page.content} {registry} />
```

To resolve components yourself instead, pass any `ComponentRegistry`:

```svelte
<script lang="ts">
  import { Renderer } from "@docvia/core/svelte";
  import type { ComponentRegistry } from "@docvia/core/svelte";
  import Callout from "#lib/Callout.svelte";
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
  import { Renderer } from "@docvia/core/svelte";
  import { hydrate } from "@docvia/core/render";
  import { registry } from "$lib/registry";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  onMount(() => {
    hydrate(data.page.manifest, registry);
  });
</script>

<Renderer nodes={data.page.content} {registry} />
```
