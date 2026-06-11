---
"@docvia/runtime": minor
"@docvia/plugin-next": minor
"@docvia/plugin-vite": minor
"@docvia/source": minor
"@docvia/ssr": minor
---

Load markdown in place as modules — drop the per-route IR JSON

docvia now compiles each markdown file **in place** through a `?docvia` loader
instead of emitting a per-route IR JSON store. The generated `.docvia/` is just
thin glue that imports the markdown modules; the host bundler (Vite, webpack,
Turbopack) compiles, code-splits, and bundles them. Content lives once in the
`.md`, so builds stay small and scale to thousands of pages, and SSR works on
the edge with no filesystem access.

**New**

- `docvia/source/browser` — a lazy, code-split client entry (each page is
  `() => import("…?docvia")`), alongside the eager `docvia/source` used for SSR.
- `@docvia/plugin-next` ships a real webpack + Turbopack `?docvia` loader, so
  Next.js compiles markdown in place too — no IR JSON fallback.
- `@docvia/runtime` exports `compileMarkdownToModule`, the shared,
  bundler-agnostic transform every loader calls.
- `createDocviaSSR({ provider })` now accepts a `ContentProvider`, a live
  `CompileService` (pass it directly), or a `(collection, slug) => IR` function.

**Breaking**

- `.docvia/ir/**/*.json` chunks are no longer emitted.
- Removed `@docvia/source/node` (`loadIRChunk`, `loadMarkdown`).
- Removed `@docvia/ssr`'s `BundledContentProvider` and `createGlobChunkLoader`,
  and the `@docvia/ssr/node` entry (`FsContentProvider`). Pass a `CompileService`
  straight to `createDocviaSSR` instead.
