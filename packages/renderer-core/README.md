# @docvia/renderer-core

Framework-agnostic rendering engine and default renderers for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/renderer-core
```

## Usage

```ts
import { renderDocument, createDefaultRendererMap } from "@docvia/renderer-core";

const result = await renderDocument(doc, createDefaultRendererMap(), ctx);
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
