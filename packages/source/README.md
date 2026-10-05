# @docvia/source

Runtime collection model for consuming compiled docvia output

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/source
```

## Usage

```ts
// Vite resolves a virtual module; Next.js aliases the bare specifier.
import { docs } from "virtual:docvia/source"; // Next.js: "docvia/source"

const page = await docs.getPage(["getting-started"]);
// page.content: RenderOutput; page.headings: always present, for a TOC
```

The component registry is a separate module: `virtual:docvia/registry` (Vite) or
`docvia/registry` (Next.js). Every docvia-generated module imports
`@docvia/source`, so apps must depend on it directly. `RenderOutput`,
`ComponentRegistry`, and `HydrationManifest` are re-exported from here.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
