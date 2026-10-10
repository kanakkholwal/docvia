---
title: "@docvia/plugin-shiki"
description: "Build-time syntax highlighting for docvia, powered by Shiki: pluggable and zero-runtime."
eyebrow: "Packages"
order: 43
---

`@docvia/plugin-shiki` is the default syntax highlighter for docvia, powered by
[Shiki](https://shiki.style). It is an ordinary docvia plugin: during
compilation its `beforeRender` hook walks the document IR, highlights every
fenced code block, and embeds the resulting HTML on the node.

Because highlighting happens at **build time**, no syntax highlighter ships to
the runtime or the edge bundle. The renderer just emits the pre-highlighted
markup.

## Installation

```bash
pnpm add @docvia/plugin-shiki
```

Requires Node.js `>=20.0.0`. ESM only.

## Usage

`shiki()` is the recommended default. Without a highlighter, docvia warns once
that code blocks render unhighlighted. Register it in the `plugins` array of
your `docvia.config.ts`:

```ts
import { defineConfig } from "@docvia/build/vite";
import { createReactRenderer } from "@docvia/core/react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createReactRenderer(),
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["typescript", "tsx", "bash", "json", "svelte"],
    }),
  ],
});
```

## Light and dark themes

Pass `themes` instead of `theme` to highlight with two themes at once. Each
token then carries both palettes as CSS variables (`--shiki-light`,
`--shiki-dark`), and each block gets `--shiki-light-bg` and `--shiki-dark-bg`.

```ts
shiki({
  themes: { light: "github-light", dark: "github-dark" },
  defaultColor: false,
});
```

`defaultColor` is passed to Shiki. `"light"` (Shiki's default) or `"dark"`
also writes that theme's colors inline; `false` emits only the variables, so
your CSS picks the palette:

```css
pre.shiki { background-color: var(--shiki-light-bg); }
pre.shiki span { color: var(--shiki-light); }
[data-theme="dark"] pre.shiki { background-color: var(--shiki-dark-bg); }
[data-theme="dark"] pre.shiki span { color: var(--shiki-dark); }
```

Switching the site theme then needs no re-highlight.

## How it works

1. The plugin's `beforeRender` hook receives the document IR.
2. It walks the tree for `code-block` nodes.
3. Each block is highlighted with Shiki's **WebAssembly engine**
   (`shiki/wasm`, the Oniguruma WASM binary) loaded via fine-grained
   `createHighlighterCore` with explicit language and theme imports.
4. The highlighted HTML is written to `props.html` on the node.
5. The renderer's `code-block` renderer prefers that pre-highlighted `props.html`
   over any render-time highlighter.

The plugin's `cacheKey()` is keyed on the theme (or `themes` and
`defaultColor`) and the regex engine, so pages re-highlight when either
changes. Fence titles, tabs, and package-manager tabs work with or without Shiki; see
[Code blocks](/docs/packages/core/render#code-blocks).

## Pluggable highlighting

Highlighting is not hardwired to Shiki. Any highlighter can be wired the same
way: a docvia plugin whose `beforeRender` populates `props.html` on
`code-block` nodes. Projects that need a smaller build footprint can swap Shiki
for a lighter library (Sugar High, Prism, …) behind the same contract, and the
end-user bundle still ships zero highlighter either way.

## See also

- [Writing plugins](/docs/guide/plugins): the plugin hook system.
- [Architecture](/docs/guide/architecture): highlighting as a build-time IR
  transform.
