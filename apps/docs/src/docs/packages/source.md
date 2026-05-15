---
title: "@docvia/source"
description: "Runtime collection model and Node markdown loader for consuming compiled docvia output."
eyebrow: "Packages"
order: 30
---

`@docvia/source` defines the runtime data model that frameworks use to consume compiled docvia documentation. It declares the page, collection, and page-tree types, the `createCollection` / `createSource` factories that the generated `.docvia/source.ts` file relies on, and `loadMarkdown` — a Node helper for compiling a single Markdown file on demand.

## Install

```bash
pnpm add @docvia/source
```

## Package exports

| Subpath | Contents | Notes |
|---|---|---|
| `.` | Re-exports `./node` + `./runtime` | The default entry. **Does not** re-export the `./internal` factories. |
| `./runtime` | Types only | `docviaPage`, `docviaCollection`, `docviaSource`, `PageTree`, `HydrationManifest`. |
| `./internal` | `createCollection`, `createSource`, `ModuleExports` | Used by the generated `.docvia/source.ts`. |
| `./node` | `loadMarkdown` | Node-only Markdown loader. |

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

## Node loader (`@docvia/source/node`)

### `loadMarkdown`

```ts
function loadMarkdown(
  filePath: string,
  options?: { highlighter?: SyntaxHighlighter },
): Promise<{ content: any; meta: unknown; manifest: unknown }>;
```

Compiles a single Markdown file on demand in a Node environment. The pipeline is:

1. `extractFrontmatter`
2. `validateFrontmatter`
3. `parseMarkdown`
4. `transformToIR`
5. `renderDocument` with the default renderer map

The default highlighter is a lazily-created Shiki singleton. When `shiki` is not installed, it falls back to plain HTML-escaping. Pass `options.highlighter` to supply your own `SyntaxHighlighter`.

```ts
import { loadMarkdown } from "@docvia/source/node";

const { content, meta, manifest } = await loadMarkdown("docs/index.md");
```

## Generated source example

The compiler emits a `.docvia/source.ts` that uses the internal factories:

```ts
import { createCollection, createSource } from "@docvia/source/internal";

const docs = createCollection({
  name: "docs",
  baseUrl: "/",
  routeKeys: ["index", "getting-started", "guides/install"],
  getModule: (slug) => import(`./pages/${slug}.js`),
  getEagerModules: async () => null,
  sourceModuleUrl: import.meta.url,
});

export const source = createSource({ docs });
```

Consuming it from a framework app:

```ts
import { source } from "docvia/source";

const page = await source.collections.docs.getPage(["getting-started"]);
const tree = source.collections.docs.pageTree;
```
