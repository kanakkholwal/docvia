---
"@docvia/cli": major
"@docvia/compiler": major
"@docvia/ir": minor
"@docvia/plugin-next": minor
"@docvia/plugin-shiki": minor
"@docvia/plugin-vite": minor
"@docvia/renderer-core": minor
"@docvia/renderer-react": minor
"@docvia/renderer-svelte": minor
"@docvia/runtime": major
"@docvia/search": minor
"@docvia/source": minor
---

fumadocs-style macro API and a lazy, cache-free pipeline.

- `defineDocs()` and `defineRegistry()` from `@docvia/source/macro`, plus `loader()` from `@docvia/source` with fumadocs method names (`getPage`, `getPages`, `getPageTree`, `generateParams`, `getPageByHref`, `serializePageTree`). The same `lib/source.ts` works in Vite (SvelteKit, React, TanStack Start) and Next.js (webpack and Turbopack).
- `page.data.load()` returns `{ content, toc, headings, manifest, structuredData }`; bodies compile on first request and stay lazy in SSR bundles (small Workers cold start).
- `meta.json` page tree: `title`, `pages` (`...`, `---Separator---`, `!exclude`, `[Text](url)`), `defaultOpen`, `root`.
- Breaking: no disk cache. `.docvia/cache.json`, `incremental` and the CLI `--no-cache` flag are gone; `.docvia/` is only written for legacy config collections.
- Pages emit compile-time `structuredData`; `createFromSource` indexes it and accepts `loader()` sources.
- Static subtrees render to HTML strings (`staticHtml` renderer option), roughly halving Svelte page payloads.
- Shiki uses the WASM engine and loads languages on demand (`engine: "javascript"` opts out).
