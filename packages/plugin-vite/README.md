# @docvia/plugin-vite

In-process Vite plugin for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add -D @docvia/plugin-vite
pnpm add @docvia/source
```

## Usage

```ts
// vite.config.ts
import { docvia } from "@docvia/plugin-vite";

export default {
  plugins: [docvia()], // loads docvia.config.* from the Vite root
};
```

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/plugin-vite";
```

`docvia()` runs the `CompileService` in-process and serves three virtual
modules: `virtual:docvia/source` (eager, server only), `virtual:docvia/source/browser`
(lazy, code-split), and `virtual:docvia/registry` (component registry). It
recompiles incrementally on every change (HMR), including added, renamed, or
deleted pages, and adds the renderer's runtime package to `ssr.noExternal` and
`optimizeDeps.include`. Types are written to `.docvia/env.d.ts`; add
`".docvia/*.d.ts"` to your `tsconfig.json` `include` and run `docvia sync` in CI.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
