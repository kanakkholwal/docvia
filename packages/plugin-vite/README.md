# @docvia/plugin-vite

In-process Vite plugin for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia), a Markdown
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
  plugins: [docvia()], // loads docvia.config.* from the Vite root; docvia(config) also works
};
```

```ts
// docvia.config.ts: renderer, plugins, components, markdown
import { defineConfig } from "@docvia/plugin-vite";
```

```ts
// src/lib/source.ts
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

`docvia()` rewrites `defineDocs()` / `defineRegistry()` in any module that
imports `@docvia/source/macro`. The index holds frontmatter only; a page body
compiles in memory when `page.data.load()` first runs. It recompiles on HMR,
including added, renamed, or deleted pages, and adds the renderer's runtime
package to `ssr.noExternal` and `optimizeDeps.include`. Works with SvelteKit
(alongside `sveltekit()`), React + Vite, and TanStack Start.

Legacy config collections (`collections` in `docvia.config.ts`, imported from
`virtual:docvia/source`) still work, but the macro is recommended.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
