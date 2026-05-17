---
title: "@docvia/plugin-vite"
description: "The in-process docvia() Vite plugin — virtual modules, incremental HMR, and a production module graph."
eyebrow: "Packages"
order: 40
---

`@docvia/plugin-vite` integrates docvia into any Vite-based app (plain Vite or
SvelteKit). The recommended export is **`docvia()`** — a single plugin that
runs the [`CompileService`](/packages/runtime) in-process, so there is no
separate `docvia build` step.

```bash
pnpm add -D @docvia/plugin-vite
```

Requires Node.js `>=20.0.0`. ESM only.

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `docvia` — the in-process Vite plugin. |

## `docvia()` — the in-process plugin

```ts
function docvia(config: docviaConfig, options?: DocviaVitePluginOptions): Plugin;
```

A single Vite plugin that owns the whole docvia integration:

- **Dev** — runs `CompileService` in-process, serves `docvia/source` as an
  in-memory **virtual module**, and recompiles incrementally. `handleHotUpdate`
  hot-swaps a `.md?docvia` module on a content change and triggers a reload on
  a route-map change; a `configureServer` watcher picks up added and removed
  files. Compile errors surface in Vite's error overlay.
- **Build** — emits the on-disk module graph (`emitDiskModuleGraph()`), which
  Vite then resolves normally.
- **`.md?docvia` transform** — routes single-file Markdown imports through the
  same service.

```ts
// vite.config.ts
import { docvia } from "@docvia/plugin-vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [docvia(docviaConfig)],
});
```

That is the complete setup. See
[Framework integration](/guide/frameworks) for the full SvelteKit walkthrough.

```ts
// A single page can also be imported directly through the ?docvia transform.
import page from "./docs/index.md?docvia";
```

## See also

- [Framework integration](/guide/frameworks) — SvelteKit and plain Vite setups.
- [`@docvia/runtime`](/packages/runtime) — the `CompileService` the plugin runs.
