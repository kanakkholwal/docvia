# @docvia/compiler

Parallel build orchestrator and module-graph generator for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/compiler
```

## Usage

```ts
import { compile } from "@docvia/compiler";

await compile({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer,
  plugins: [],
  config,
});
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
