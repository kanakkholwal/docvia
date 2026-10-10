---
title: "@docvia/core/source"
description: "Declare docs collections in code and query them with loader()."
eyebrow: "Packages"
order: 7
---

`@docvia/core/source` is how an app reads its docs. Declare a collection with `defineDocs()` from `@docvia/core/source/macro`, then pass it to `loader()` for page lookup, the page tree and static params. The API mirrors fumadocs (`fumadocs-mdx/macro` + `fumadocs-core/source`).

The docvia bundler plugin (`docvia()` for Vite, `withDocvia()` for Next.js) rewrites the macro calls at build time into an index of the folder's pages. Nothing is scanned at runtime, and page bodies compile lazily, in memory, on first `load()`.

## Install

```bash
pnpm add @docvia/core
```

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `loader()` and its types (`Source`, `Page`, `MetaData`, `LoaderOutput`), plus `PageTree`, `RenderOutput`, `ComponentRegistry`, `HydrationManifest`, `StructuredData`. |
| `./macro` | `defineDocs()`, `defineRegistry()`, `BaseFrontmatter`, `LoadedPage`, `TocItem`. |
| `./runtime` | Types only (`PageTree`, legacy `docviaCollection` types). |
| `./macro-runtime`, `./internal` | Used by generated code. Not public API. |

## Declare a collection

```ts title="lib/source.ts"
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  // optional: extra frontmatter fields, any Standard Schema lib
  docs: { schema: z.object({ author: z.string().optional() }) },
});

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

| Option | Type | Purpose |
|---|---|---|
| `dir` | `string` | Content directory, relative to the project root. Must be a string literal. |
| `docs.schema` | Standard Schema | Extra frontmatter fields (Zod, Valibot, ArkType), merged with the built-ins. |

Every page's frontmatter includes `title`, `description`, `tags`, `draft`, optional `order` and `slug`, plus your schema's fields, all typed.

In Vite, any module that imports `@docvia/core/source/macro` is transformed. In Next.js only files named in `macroFiles` are (default `source.{ts,tsx,js,mjs}` and `registry.{ts,tsx,js}`). Calling `defineDocs()` without the plugin throws.

## Component registry

```ts title="lib/registry.ts"
import { defineRegistry } from "@docvia/core/source/macro";

// Components from `components` in docvia.config.ts.
export const registry = defineRegistry();
```

Pass `registry` to `<Renderer>` (Svelte) or `<Renderer>` (React).

## `loader()`

```ts
function loader<D>(options: { baseUrl: string; source: Source<D> }): LoaderOutput<D>;
```

| Member | Returns | Behavior |
|---|---|---|
| `getPage(slugs?)` | `Page \| undefined` | Synchronous lookup by slug segments. `[]` or `undefined` is the index page. |
| `getPages()` | `Page[]` | Every page, frontmatter only. |
| `pageTree` / `getPageTree()` | `PageTree.Root` | Navigation tree, built once and cached. |
| `getPageByHref(href)` | `{ page, hash? } \| undefined` | Resolves a link like `/docs/guide#setup`. |
| `generateParams(key?)` | `Record<key, string[]>[]` | Static params, keyed `slug` by default. |
| `serializePageTree(tree)` | `Promise<PageTree.Root>` | Identity (fumadocs parity: the tree already holds plain strings). |

A `Page` has `slugs`, `url`, `path` (relative to the collection directory) and `data`. For a `defineDocs()` source, `data` is the frontmatter plus `load()`:

```ts
const page = source.getPage(slugs); // sync, frontmatter only
if (!page) notFound();
const { content, toc, headings, manifest, structuredData } = await page.data.load();
```

| `load()` field | Meaning |
|---|---|
| `content` | Render tree for `<Renderer nodes>` / `<Renderer nodes>`. |
| `toc` | `{ title, url: "#id", depth }[]` |
| `headings` | `{ depth, text, id }[]`, the h2 to h6 outline. |
| `manifest` | Island hydration manifest. |
| `structuredData` | Search sections, extracted at compile time. Used by `createFromSource()`. |

`load()` is memoised per page, so repeated calls share one compile. Bodies stay out of the index, which keeps SSR cold start small on Cloudflare Workers.

`loader()` also accepts any hand-built `Source`: `{ files: Array<PageFile | MetaFile> }`.

## `meta.json`

A `meta.json` in a content folder controls that folder's tree node:

```json title="content/docs/guide/meta.json"
{
  "title": "Guide",
  "pages": ["install", "---Basics---", "...", "!drafts", "[GitHub](https://github.com/kanakkholwal/docvia)"],
  "defaultOpen": true
}
```

| Field | Meaning |
|---|---|
| `title` | Folder name in the tree. Defaults to the folder's `index.md` title. |
| `pages` | Child order: names, `...` (the rest, sorted by `order` then name), `---Label---` (separator), `!name` (exclude), `[Text](url)` (link). |
| `defaultOpen` | Folder starts expanded. |
| `root` | Folder starts its own sidebar. |

Without `meta.json`, children sort by frontmatter `order`, then name.

## `namespace PageTree`

```ts
namespace PageTree {
  interface Root { name: string; children: Node[] }
  interface Item { type: "page"; name: string; url: string; external?: boolean; $id?: string }
  interface Folder {
    type: "folder";
    name: string;
    children: Node[];
    index?: Item;
    defaultOpen?: boolean;
    root?: boolean;
    $id?: string;
  }
  interface Separator { type: "separator"; name: string }
  type Node = Item | Folder | Separator;
}
```

## Legacy config collections

Collections declared in `docvia.config.ts` (`collections`, `frontmatter`, `sourceDir`) are still served as `virtual:docvia/source` (Vite) and `docvia/source` (Next), typed by `docviaCollection` in `./runtime`, whose `getPage()` is async. Prefer `defineDocs()` for new projects.
