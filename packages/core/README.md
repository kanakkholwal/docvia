# @docvia/core

Markdown parsing pipeline (micromark + unified) for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/core
```

## Usage

```ts
import { parseMarkdown } from "@docvia/core";

const { ast } = await parseMarkdown(md, { remarkPlugins: [] });
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
