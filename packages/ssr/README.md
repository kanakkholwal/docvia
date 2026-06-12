# @docvia/ssr

Request-time server rendering for docvia.

`createDocviaSSR()` turns an IR document into a renderable page tree on demand,
backed by an in-memory LRU cache keyed by content hash.

> Most apps don't need this. Under the in-place architecture the generated
> `source.ts` uses static `?docvia` imports, so a framework app (Vite, Next.js)
> — including on the edge — renders pages directly via `docs.getPage(...)` with
> the content already bundled. Reach for `@docvia/ssr` only for a non-framework
> Node server that renders per request.

Content is supplied through a generic `ContentSource` — a `ContentProvider`
(`getDocument(collection, slug)`), a live `CompileService` (which already
satisfies that shape), or a `(collection, slug) => IR` function. The package
itself never touches the filesystem, so it is edge-safe regardless of source.

```ts
import { createDocviaSSR } from "@docvia/ssr";

// A live CompileService is itself a content source:
const ssr = createDocviaSSR({ provider: service });
const page = await ssr.render("docs", "getting-started");
```

The render path is the same `@docvia/renderer-core` pipeline used by the
build, so SSR output matches build output. With `@docvia/plugin-shiki` the IR
is already highlighted, so no syntax highlighter ships to the edge bundle.
