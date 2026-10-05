# @docvia/renderer-svelte

Svelte renderer adapter for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/renderer-svelte svelte
```

`svelte ^5` is a peer dependency.

## Usage

```ts
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

const renderer = createSvelteRenderer({
  transform: (output, doc) => output, // optional: rewrite the RenderOutput tree
});
```

Render pages with `<Renderer nodes={content} {registry} />` from
`@docvia/renderer-svelte`, where `content` comes from `await page.data.load()`
and `registry` from `defineRegistry()` (`@docvia/source/macro`).

Syntax highlighting is a build-time plugin, not a renderer option. Add
[`@docvia/plugin-shiki`](https://github.com/kanakkholwal/docvia/tree/main/packages/plugin-shiki)
to `plugins` in your docvia config.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
