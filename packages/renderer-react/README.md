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
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

const renderer = createReactRenderer({
  highlighter: createShikiHighlighter({ theme: "github-dark" }),
});
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
