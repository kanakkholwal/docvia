# @docvia/renderer-svelte

Svelte renderer adapter for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/renderer-svelte svelte
```

## Usage

```ts
import { createSvelteRenderer, createShikiHighlighter } from "@docvia/renderer-svelte/node";

const renderer = createSvelteRenderer({
  highlighter: createShikiHighlighter({ theme: "github-dark" }),
});
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
