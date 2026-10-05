# @docvia/renderer-react

React renderer adapter for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/renderer-react react react-dom
```

## Usage

```ts
import { createReactRenderer } from "@docvia/renderer-react";

const renderer = createReactRenderer({
  transform: (output, doc) => output, // optional: rewrite the RenderOutput tree
});
```

Render pages with `<DocviaContent nodes={page.content} registry={registry} />`,
importing `registry` from `docvia/registry` (Next.js) or `virtual:docvia/registry`
(Vite). `hydrate()` from `@docvia/renderer-react/client` mounts islands and
switches tabbed code groups.

Syntax highlighting is a build-time plugin, not a renderer option. Add
[`@docvia/plugin-shiki`](https://github.com/kanakkholwal/docvia/tree/main/packages/plugin-shiki)
to `plugins` in your docvia config.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
