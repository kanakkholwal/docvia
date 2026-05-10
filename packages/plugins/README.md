# @docvia/plugins

Plugin runner, defineConfig, and config loader for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/plugins
```

## Usage

```ts
import { defineConfig, loadConfig, PluginRunner } from "@docvia/plugins";

const config = defineConfig({ sourceDir: "docs", outDir: ".docvia" });
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
