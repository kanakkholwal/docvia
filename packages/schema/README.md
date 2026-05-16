# @docvia/schema

Frontmatter validation (Zod), YAML parsing, and TS codegen for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia) — a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/schema
```

## Usage

```ts
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";

const { data, content } = extractFrontmatter(raw);
const frontmatter = validateFrontmatter(data);
```

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
