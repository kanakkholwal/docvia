---
title: "@docvia/ssr"
description: "Request-time server rendering for docvia — on Node and on edge runtimes."
eyebrow: "Packages"
order: 32
---

`@docvia/ssr` renders a docvia document **per request**, rather than ahead of
time into a static site. `createDocviaSSR()` turns an `IRDocument` into a
renderable page tree on demand, backed by an in-memory LRU cache keyed by
content hash.

It renders through the same [`@docvia/renderer-core`](/packages/renderer-core)
pipeline the build uses, so SSR output matches build output exactly.

## Installation

```bash
pnpm add @docvia/ssr
```

Requires Node.js `>=20.0.0` for the `./node` entry. The default entry is
edge-safe. ESM only.

## Package exports

| Subpath | Contents | Runtime |
|---|---|---|
| `.` | `createDocviaSSR`, `BundledContentProvider`, `createGlobChunkLoader`, `LRUCache`, types. | Edge-safe — no `node:fs`. |
| `./node` | `FsContentProvider`. | Node only. |

The split exists because edge runtimes (Cloudflare Workers and friends) have no
`node:fs`. The default entry is safe to bundle for the edge; the Node-only
content provider lives behind `./node`.

## Content providers

`createDocviaSSR()` resolves IR through a **`ContentProvider`**. Two are
shipped:

### `BundledContentProvider` — edge-safe

Serves pre-built per-route IR chunks (emitted to `.docvia/ir/` at build time)
through a caller-supplied loader. No filesystem, no Markdown parsing at request
time.

```ts
import {
  createDocviaSSR,
  BundledContentProvider,
  createGlobChunkLoader,
} from "@docvia/ssr";

const ssr = createDocviaSSR({
  provider: BundledContentProvider(
    createGlobChunkLoader(import.meta.glob("/.docvia/ir/**/*.json")),
  ),
});

const page = await ssr.render("docs", "getting-started");
```

`createGlobChunkLoader()` turns a Vite `import.meta.glob` of the build's IR
chunks into a `ChunkLoader` — the glob is statically analysable, so every chunk
is code-split and the bundle stays edge-safe.

### `FsContentProvider` — Node

Wraps a live `CompileService`, compiling Markdown from disk on a cache miss.
Use it for Node servers and dev.

```ts
import { createDocviaSSR } from "@docvia/ssr";
import { FsContentProvider } from "@docvia/ssr/node";

const ssr = createDocviaSSR({
  provider: new FsContentProvider(service),
});
```

## Caching

Rendered pages are cached in an in-memory `LRUCache` keyed by the document's
`contentHash`. A document whose content has not changed is served from the
cache without re-rendering. The cache is per SSR-renderer instance; clear it
with `ssr.clearCache()`.

## Highlighting on the edge

With [`@docvia/plugin-shiki`](/packages/plugin-shiki), the per-route IR chunks
ship **already highlighted** — the highlighted HTML is baked into the IR at
build time. So an edge SSR bundle ships no syntax highlighter at all.

## See also

- [Framework integration](/guide/frameworks) — the SSR setup walkthrough.
- [`@docvia/runtime`](/packages/runtime) — the `CompileService` behind
  `FsContentProvider`.
- [Architecture](/guide/architecture) — the three run modes.
