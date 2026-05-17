---
"@docvia/renderer-core": patch
"@docvia/renderer-react": patch
"@docvia/renderer-svelte": patch
"@docvia/cli": patch
---

Renderers no longer bundle a syntax highlighter — highlighting is fully a build-time plugin.

Syntax highlighting moved to `@docvia/plugin-shiki` (a docvia plugin that bakes highlighted HTML into the IR). The renderer adapters carried their own Shiki highlighter, which duplicated that responsibility and pulled `shiki` into the renderer dependency tree. That highlighter is now removed.

- `@docvia/renderer-react` / `@docvia/renderer-svelte` — the `createShikiHighlighter` export is removed, and `createReactRenderer()` / `createSvelteRenderer()` no longer accept a `highlighter` option. The `shiki` dependency is dropped from both packages.
- `@docvia/renderer-core` — `RenderContext.highlighter` is now optional. The `code-block` renderer emits a node's pre-highlighted `props.html` when present (set by a build-time plugin); when there is neither pre-highlighted HTML nor a render-time `highlighter`, it emits a plain `<pre><code>` block instead of throwing.
- `@docvia/cli` — `docvia init` scaffolds a `docvia.config.ts` that registers the `shiki()` plugin in `plugins` instead of passing a `highlighter` to the renderer.

Migration: drop `createShikiHighlighter` / the renderer `highlighter` option, and add `shiki()` from `@docvia/plugin-shiki` to your config's `plugins` array.
