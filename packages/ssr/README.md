# @docvia/ssr

Request-time server rendering for docvia.

`createDocviaSSR()` turns an IR document into a renderable page tree on demand,
backed by an in-memory LRU cache keyed by content hash. Content is supplied by
a `ContentProvider`:

- **`BundledContentProvider`** (`@docvia/ssr`) — edge-safe. Serves pre-built
  per-route IR chunks (emitted to `.docvia/ir/` at build time). No `node:fs`,
  no markdown parsing at request time. Use on Cloudflare Workers / edge.
- **`FsContentProvider`** (`@docvia/ssr/node`) — Node only. Wraps a live
  `CompileService`, compiling markdown from disk. Use for Node servers and dev.

```ts
import {
  createDocviaSSR,
  BundledContentProvider,
  createGlobChunkLoader,
} from "@docvia/ssr";

// `createGlobChunkLoader` turns a Vite `import.meta.glob` of the build's IR
// chunks into a `ChunkLoader` — statically code-split, edge-safe.
const ssr = createDocviaSSR({
  provider: BundledContentProvider(
    createGlobChunkLoader(import.meta.glob("/.docvia/ir/**/*.json")),
  ),
});
const page = await ssr.render("docs", "getting-started");
```

The render path is the same `@docvia/renderer-core` pipeline used by the
build, so SSR output matches build output. With `@docvia/plugin-shiki` the IR
is already highlighted, so no syntax highlighter ships to the edge bundle.
