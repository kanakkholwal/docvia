---
title: "@docvia/ssr"
description: "Request-time server rendering for docvia: on Node and on edge runtimes."
eyebrow: "Packages"
order: 32
---

`@docvia/ssr` renders a docvia document **per request**, rather than ahead of
time into a static site. `createDocviaSSR()` turns an `IRDocument` into a
renderable page tree on demand, backed by an in-memory LRU cache keyed by
content hash.

It renders through the same [`@docvia/renderer-core`](/docs/packages/renderer-core)
pipeline the build uses, so SSR output matches build output exactly.

## Installation

```bash
pnpm add @docvia/ssr
```

Requires Node.js `>=20.0.0`. The package is edge-safe and contains no
`node:fs`. ESM only.

> **Most apps don't need this package.** Under the in-place architecture the
> generated `source.ts` uses static `?docvia` imports, so a framework app (Vite,
> Next.js), including on the edge, renders pages directly through
> `docs.getPage(...)` with the content already bundled. Reach for `@docvia/ssr`
> only for a **non-framework Node server** that renders per request.

## Package exports

| Subpath | Contents | Runtime |
|---|---|---|
| `.` | `createDocviaSSR`, `LRUCache`, and types (`ContentProvider`, `ContentSource`, `SSROptions`, …). | Edge-safe, with no `node:fs`. |

## Content source

`createDocviaSSR({ provider })` resolves IR through a generic **`ContentSource`**,
which is either:

- a **`ContentProvider`**, meaning any object with `getDocument(collection, slug) => Promise<IRDocument | undefined>`,
- a live **`CompileService`**, which already satisfies that shape, so pass it directly, or
- a plain **function** `(collection, slug) => IRDocument | undefined`.

```ts
import { createDocviaSSR } from "@docvia/ssr";

// A live CompileService is itself a content source:
const ssr = createDocviaSSR({ provider: service });

// …or supply your own resolver function:
const ssr2 = createDocviaSSR({
  provider: (collection, slug) => myStore.get(collection, slug),
});

const page = await ssr.render("docs", "getting-started");
```

There is no separate edge/Node split anymore: the package itself never touches
the filesystem, so where IR comes from is entirely up to the `ContentSource` you
pass.

## Caching

Rendered pages are cached in an in-memory `LRUCache` keyed by the document's
`contentHash`. A document whose content has not changed is served from the
cache without re-rendering. The cache is per SSR-renderer instance; clear it
with `ssr.clearCache()`.

## Highlighting on the edge

With [`@docvia/plugin-shiki`](/docs/packages/plugin-shiki), the IR ships **already
highlighted**: the highlighted HTML is baked into the IR at build time. So an
edge SSR bundle ships no syntax highlighter at all.

## See also

- [Framework integration](/docs/guide/frameworks): the SSR setup walkthrough.
- [`@docvia/runtime`](/docs/packages/runtime): the `CompileService` you can pass
  directly as a `ContentSource`.
- [Architecture](/docs/guide/architecture): the three run modes.
