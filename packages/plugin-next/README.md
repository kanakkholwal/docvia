# @docvia/plugin-next

Next.js integration for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia), a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add -D @docvia/plugin-next
pnpm add @docvia/source
```

## Usage

```ts
// next.config.ts
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia()({
  /* your next.config */
});
```

```ts
// docvia.config.ts: renderer, plugins, components, markdown
import { defineConfig } from "@docvia/plugin-next";
```

```ts
// lib/source.ts
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

```ts
// lib/registry.ts: components from `components` in docvia.config.ts
import { defineRegistry } from "@docvia/source/macro";

export const registry = defineRegistry();
```

`withDocvia()` rewrites `defineDocs()` / `defineRegistry()` at build time for
webpack and Turbopack. Only files named `source.{ts,tsx,js,mjs}` or
`registry.{ts,tsx,js}` are transformed; pass `withDocvia({ macroFiles: [...] })`
to use other names. Pages compile lazily in memory; nothing is written to disk.

Legacy config collections (`collections` in `docvia.config.ts`, imported from
`docvia/source`) still work, but the macro is recommended.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
