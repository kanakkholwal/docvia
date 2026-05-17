# @docvia/renderer-svelte

Svelte renderer adapter for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/renderer-svelte svelte
```

## Usage

```ts
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

const renderer = createSvelteRenderer();
```

Syntax highlighting is a build-time plugin, not a renderer option — add
[`@docvia/plugin-shiki`](https://github.com/kanakkholwal/docvia/tree/main/packages/plugin-shiki)
to `plugins` in your docvia config.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
