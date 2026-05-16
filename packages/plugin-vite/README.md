# @docvia/plugin-vite

In-process Vite plugin for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add -D @docvia/plugin-vite
```

## Usage

```ts
import { docvia } from "@docvia/plugin-vite";
import docviaConfig from "./docvia.config";

export default {
  plugins: [docvia(docviaConfig)],
};
```

`docvia()` runs the `CompileService` in-process — no separate `docvia build`
step. In dev it serves `docvia/source` as a virtual module and recompiles
incrementally on every change (HMR); for production builds it emits the on-disk
module graph.

The legacy `docviaSourcePlugin()` + `docviaMarkdownPlugin()` exports remain for
setups that still run a separate `docvia build` step.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
