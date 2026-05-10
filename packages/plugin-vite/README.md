# @docvia/plugin-vite

Vite plugin for docvia (?docvia virtual modules)

Part of [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add -D @docvia/plugin-vite
```

## Usage

```ts
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import docviaConfig from "./docvia.config";

export default {
  plugins: [docviaSourcePlugin(), docviaMarkdownPlugin(docviaConfig)],
};
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
