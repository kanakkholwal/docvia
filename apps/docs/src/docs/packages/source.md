---
title: "@docvia/source"
description: "Runtime collection model for consuming compiled docvia output."
eyebrow: "Packages"
order: 30
---

`@docvia/source` defines the runtime data model that frameworks use to consume compiled docvia documentation. It declares the page, collection, and page-tree types and the `createCollection` / `createSource` factories that the generated `.docvia/source.ts` file relies on. It contains **no Markdown loader** — under the in-place architecture the host bundler's `?docvia` transform compiles each `.md` file as a module, and these factories just wire those modules into collections.

## Install

```bash
pnpm add @docvia/source
```

## Package exports

| Subpath | Contents | Notes |
|---|---|---|
| `.` | Re-exports `./runtime` | The default entry — **types only**, no runtime values. **Does not** re-export the `./internal` factories. |
| `./runtime` | Types only | `docviaPage`, `docviaCollection`, `docviaSource`, `PageTree`, `HydrationManifest`. |
| `./internal` | `createCollection`, `createSource`, `ModuleExports` | Used by the generated `.docvia/source.ts`. |

> `createCollection` and `createSource` live in `./internal` and are intentionally **not** re-exported from `.`. Application code generally does not import them directly — the compiler emits a `.docvia/source.ts` that calls them for you. Import from `@docvia/source/internal` only when you are building generated output by hand.

This package ships no binary.

## Runtime types (`@docvia/source/runtime`)

### `HydrationManifest`

```ts
type HydrationManifest = any;
```

An opaque manifest describing the interactive islands embedded in a page. Its concrete shape is renderer-specific.

### `namespace PageTree`

The navigation tree model. A `Root` holds an ordered list of `Node`s; each `Node` is one of three shapes.

```ts
namespace PageTree {
  interface Root {
    name: string;
    children: Node[];
  }

  interface Item {
    type: "page";
    name: string;
    url: string;
    $id?: string;
  }

  interface Folder {
    type: "folder";
    name: string;
    children: Node[];
    index?: Item;
    defaultOpen?: boolean;
    $id?: string;
  }

  interface Separator {
    type: "separator";
    name: string;
  }

  type Node = Item | Folder | Separator;
}
```

| Member | Field | Meaning |
|---|---|---|
| `Root` | `name` | Display name of the tree root. |
| `Root` | `children` | Top-level nodes. |
| `Item` | `type` | Always `"page"`. |
| `Item` | `name` | Link label. |
| `Item` | `url` | Resolved page URL. |
| `Item` | `$id` | Optional stable identifier. |
| `Folder` | `type` | Always `"folder"`. |
| `Folder` | `children` | Nested nodes. |
| `Folder` | `index` | Optional `Item` rendered as the folder's own landing page. |
| `Folder` | `defaultOpen` | Whether the folder starts expanded. |
| `Folder` | `$id` | Optional stable identifier. |
| `Separator` | `type` | Always `"separator"`. |
| `Separator` | `name` | Separator label. |

### `interface docviaPage`

```ts
interface docviaPage<TFrontmatter = unknown> {
  slugs: string[];
  url: string;
  data: TFrontmatter;
  content: any;
  manifest: HydrationManifest;
  headings?: Array<{ depth: number; text: string; id: string }>;
}
```

| Field | Type | Meaning |
|---|---|---|
| `slugs` | `string[]` | Path segments identifying the page. |
| `url` | `string` | Resolved URL. |
| `data` | `TFrontmatter` | Validated frontmatter. |
| `content` | `any` | Renderer-native compiled content (e.g. a component module). |
| `manifest` | `HydrationManifest` | Island hydration manifest. |
| `headings` | array | Optional flat list of headings for building a table of contents. |

### `interface docviaCollection`

```ts
interface docviaCollection<TFrontmatter = unknown, _TRouteKey extends string = string> {
  getPage(slugs: string[] | undefined): Promise<docviaPage<TFrontmatter> | undefined>;
  getPages(): Array<{ slugs: string[]; url: string; data: TFrontmatter }>;
  get pageTree(): PageTree.Root;
  getPageTree(): PageTree.Root;
  generateParams<TSlug extends string = "slug">(slug?: TSlug): Record<TSlug, string[]>[];
}
```

| Member | Signature | Behavior |
|---|---|---|
| `getPage` | `(slugs) => Promise<docviaPage \| undefined>` | Resolves a single page by slug segments. Returns `undefined` when no page matches. |
| `getPages` | `() => Array<{ slugs, url, data }>` | Lightweight listing of every page, without loading content. |
| `pageTree` | getter `=> PageTree.Root` | The navigation tree as a property. |
| `getPageTree` | `() => PageTree.Root` | The navigation tree as a method (equivalent to `pageTree`). |
| `generateParams` | `(slug?) => Record<TSlug, string[]>[]` | Produces route params for static generation, keyed by the given `slug` name. |

### `interface docviaSource`

```ts
interface docviaSource {
  collections: Record<string, docviaCollection<unknown, string>>;
}
```

The top-level container. `collections` maps each collection name to its `docviaCollection`.

## Internal factories (`@docvia/source/internal`)

### `interface ModuleExports`

```ts
interface ModuleExports {
  meta: unknown;
  content: any;
  manifest: unknown;
}
```

The shape of a compiled page module emitted into `.docvia/`. `meta` carries frontmatter (including `order`), `content` is the renderer-native module, and `manifest` is the hydration manifest.

### `createCollection`

```ts
function createCollection<TFrontmatter, TRouteKey extends string>(opts: {
  name: string;
  baseUrl: string;
  routeKeys: readonly TRouteKey[];
  getModule(slug: string): Promise<ModuleExports | undefined>;
  getEagerModules(): Promise<Record<string, ModuleExports> | null>;
  sourceModuleUrl: string;
}): docviaCollection<TFrontmatter, TRouteKey>;
```

Builds a `docviaCollection` from a set of route keys and module loaders.

| Option | Type | Purpose |
|---|---|---|
| `name` | `string` | Collection name. |
| `baseUrl` | `string` | URL prefix prepended to every page. |
| `routeKeys` | `readonly TRouteKey[]` | All known page slugs in the collection. |
| `getModule` | `(slug) => Promise<ModuleExports \| undefined>` | Lazily loads one page module. |
| `getEagerModules` | `() => Promise<Record<string, ModuleExports> \| null>` | Loads every module up front (or `null` to disable eager mode). |
| `sourceModuleUrl` | `string` | URL of the generated source module, used for relative resolution. |

Behavior:

- Builds a **parent → children page tree** from `routeKeys`.
- Sorts siblings by `meta.order`, then by slug.
- A slug that has children becomes a `Folder`; otherwise it becomes an `Item`.
- `getPage` normalizes the incoming slugs and keys on `slugs.join("/") || "index"`.
- `generateParams(slug = "slug")` maps every route key to `{ [slug]: segments }`, where the index page maps to an empty array `[]`.

### `createSource`

```ts
function createSource<TCollections>(
  collections: TCollections,
): docviaSource & { collections: TCollections };
```

Wraps a record of collections into a `docviaSource`. The return type preserves the concrete `TCollections` shape, so accessing `source.collections.docs` stays fully typed.

## Generated source example

The compiler emits a `.docvia/source.ts` that uses the internal factories. Under
the in-place architecture `getModule` resolves the Markdown file as a module via
the host bundler's `?docvia` transform (no JSON, no filesystem read):

```ts
import { createCollection, createSource } from "@docvia/source/internal";

const docs = createCollection({
  name: "docs",
  baseUrl: "/",
  routeKeys: ["index", "getting-started", "guides/install"],
  // `?docvia` is compiled in place by the bundler — content lives in the .md
  getModule: (slug) => import(`../src/docs/${slug}.md?docvia`),
  // eager metadata for the page tree / getPages(), resolved on demand
  getEagerModules: async () => null,
  sourceModuleUrl: import.meta.url,
});

export const source = createSource({ docs });
```

Consuming it from a framework app. The import specifier is **bundler-specific**:

```ts
// Vite (and SvelteKit): the Vite plugin serves a virtual module
import { source } from "virtual:docvia/source";

// Next.js (webpack + Turbopack): the plugin aliases the bare specifier
import { source } from "docvia/source";

const page = await source.collections.docs.getPage(["getting-started"]);
const tree = source.collections.docs.pageTree;
```

> A lazy, client-code-split counterpart is generated alongside it —
> `virtual:docvia/source/browser` (Vite) / `docvia/source/browser` (Next) — whose
> `getModule` uses `() => import("…md?docvia")` so each page is its own chunk.
