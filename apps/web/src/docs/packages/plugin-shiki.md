---
title: "@docvia/plugin-shiki"
description: "Build-time syntax highlighting for docvia, powered by Shiki — pluggable and zero-runtime."
eyebrow: "Packages"
order: 43
---

`@docvia/plugin-shiki` is the default syntax highlighter for docvia, powered by
[Shiki](https://shiki.style). It is an ordinary docvia plugin: during
compilation its `beforeRender` hook walks the document IR, highlights every
fenced code block, and embeds the resulting HTML on the node.

Because highlighting happens at **build time**, no syntax highlighter ships to
the runtime or the edge bundle — the renderer just emits the pre-highlighted
markup.

## Installation

```bash
pnpm add @docvia/plugin-shiki
```

Requires Node.js `>=20.0.0`. ESM only.

## Usage

Register it in the `plugins` array of your `docvia.config.ts`:

```ts
import { defineConfig } from "@docvia/cli";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["typescript", "tsx", "bash", "json", "svelte"],
    }),
  ],
});
```

## How it works

1. The plugin's `beforeRender` hook receives the document IR.
2. It walks the tree for `code-block` nodes.
3. Each block is highlighted with Shiki's **WebAssembly engine**
   (`shiki/wasm`, the Oniguruma WASM binary) loaded via fine-grained
   `createHighlighterCore` with explicit language and theme imports.
4. The highlighted HTML is written to `props.html` on the node.
5. The renderer's `code-block` renderer prefers that pre-highlighted `props.html`
   over any render-time highlighter.

The plugin's `cacheKey()` is keyed on the theme and language list, so the
incremental cache correctly re-highlights when either changes.

## Pluggable highlighting

Highlighting is not hardwired to Shiki. Any highlighter can be wired the same
way — a docvia plugin whose `beforeRender` populates `props.html` on
`code-block` nodes. Projects that need a smaller build footprint can swap Shiki
for a lighter library (Sugar High, Prism, …) behind the same contract, and the
end-user bundle still ships zero highlighter either way.

## See also

- [Writing plugins](/docs/guide/plugins) — the plugin hook system.
- [Architecture](/docs/guide/architecture) — highlighting as a build-time IR
  transform.
