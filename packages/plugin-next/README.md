# @docvia/plugin-next

Next.js integration for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add -D @docvia/plugin-next
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
// docvia.config.ts
import { defineConfig } from "@docvia/plugin-next";
```

Import pages from `docvia/source` and the component registry from
`docvia/registry`. Install `@docvia/source` in your app (the generated code
imports it) and add `".docvia/*.d.ts"` to your `tsconfig.json` `include`.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
