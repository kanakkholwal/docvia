---
title: "@docvia/core"
description: "The markdown parsing pipeline that turns raw markdown into a sanitized HAST tree, built on unified, remark, and rehype."
eyebrow: "Packages"
order: 11
---

`@docvia/core` is the markdown parsing layer of docvia. It wraps the [`unified`](https://unifiedjs.com/) ecosystem — `remark` for markdown and `rehype` for HTML — into a single function, `parseMarkdown`, that takes a raw markdown string and returns a sanitized HAST (HTML AST) tree ready to be handed to `transformToIR` from `@docvia/ir`.

The package owns one well-defined responsibility: producing a safe, structured AST. It does not handle frontmatter (that is `@docvia/schema`), it does not produce the IR (that is `@docvia/ir`), and it does not orchestrate builds (that is `@docvia/compiler`). It also bakes in security: a strict `rehype-sanitize` pass runs at the end of every parse so untrusted markdown cannot inject dangerous markup.

## Installation

```bash
pnpm add @docvia/core
```

Requires Node.js `>=20.0.0`. ESM only.

## Exports

`@docvia/core` exposes a single entry point.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.mjs` | `parseMarkdown`, plus the `ParseOptions` and `ParseResult` types. |

```ts
import { parseMarkdown } from "@docvia/core";
import type { ParseOptions, ParseResult } from "@docvia/core";
```

## The parsing pipeline

`parseMarkdown` builds a `unified` processor with a fixed plugin order. User-supplied remark plugins are spliced into the middle, after the built-in remark plugins but before the markdown-to-HTML conversion. The full pipeline, in order:

1. **`remark-parse`** — parses the markdown string into an MDAST (Markdown AST) tree.
2. **`remark-gfm`** — adds GitHub-Flavored Markdown: tables, strikethrough, task lists, autolinks.
3. **`remark-directive`** — parses directive syntax (`:::name`, `:name`, `::name`) into directive nodes.
4. **directive-to-HAST** — an internal remark plugin that converts container and leaf directive nodes into HAST-compatible `div` elements, so they survive the rest of the pipeline as structured nodes rather than being dropped.
5. **User remark plugins** — every plugin from `options.remarkPlugins`, in array order.
6. **`remark-rehype`** — converts MDAST into HAST, with `allowDangerousHtml` enabled so raw HTML is preserved for the next step.
7. **`rehype-raw`** — re-parses any embedded raw HTML into proper HAST nodes.
8. **`rehype-sanitize`** — applies a strict sanitization schema, stripping anything not explicitly allowed.

### Directive handling

The internal `directive-to-HAST` step rewrites each `containerDirective` and `leafDirective` node into a `div` element. The directive's name is stored on a `data-directive` attribute and its kind on `data-directive-type` (`"block"` for container directives, `"inline"` for leaf directives). Directive attributes are prefixed with `data-prop-` so they survive the sanitization pass. Downstream, `transformToIR` reads these attributes back to reconstruct `component` and `component-inline` nodes.

### Sanitization schema

The final `rehype-sanitize` step extends the library's `defaultSchema`. It explicitly allows the standard block and inline document tags — `div`, `span`, `blockquote`, `hr`, the full table family, lists, headings, `code`, `pre`, `img`, `br`, and the GFM essentials. For attributes it permits `class`, `className`, `style`, and **all** `data-*` attributes (so directive metadata passes through); `a` elements may carry `href`, `title`, `target`, and `rel`; `img` elements may carry `src`, `alt`, and `title`. Anything outside this schema is removed. As a result, dangerous elements such as `script`, `iframe`, `object`, and `embed` never reach the IR — and `@docvia/ir`'s transform drops them again as a defense-in-depth measure.

### Processor caching

Building a `unified` processor is not free, so `@docvia/core` caches them. When `parseMarkdown` is called with no remark plugins, a single shared base processor is built once and reused for every subsequent call. When remark plugins are supplied, the processor is cached in a `WeakMap` keyed by the `remarkPlugins` array reference. Because the config object — and therefore its `remarkPlugins` array — is stable within a single build, the pipeline is constructed at most once per build rather than once per document.

> The cache is keyed by array **reference**, not by contents. If you build a fresh `remarkPlugins` array on every call, the cache will miss every time. Reuse the same array instance across a build.

## API reference

### `ParseOptions`

```ts
interface ParseOptions {
  readonly remarkPlugins?: readonly any[];
}
```

| Field | Type | Description |
| --- | --- | --- |
| `remarkPlugins` | `readonly any[] \| undefined` | Additional remark plugins inserted after the built-in remark plugins and before `remark-rehype`. Omit or pass an empty array to use the shared base processor. |

### `ParseResult`

```ts
interface ParseResult {
  readonly ast: HastRoot;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `ast` | `HastRoot` | The sanitized HAST root node produced by the pipeline. |

### `parseMarkdown`

```ts
function parseMarkdown(
  content: string,
  options?: ParseOptions,
): Promise<ParseResult>
```

Parses a markdown string and returns a `Promise` resolving to a `ParseResult`. The input should be **markdown body only** — strip frontmatter first with `extractFrontmatter` from `@docvia/schema`. Internally, `parseMarkdown` selects or builds a cached processor, runs the synchronous parse to MDAST, then awaits the asynchronous `run` step that produces the final HAST.

## Usage example

A minimal parse with no plugins:

```ts
import { parseMarkdown } from "@docvia/core";

const { ast } = await parseMarkdown("# Hello\n\nA **GFM** table:\n\n| a | b |\n| - | - |\n| 1 | 2 |");
// `ast` is a sanitized HAST root, ready for transformToIR
```

Passing a custom remark plugin, reusing a stable array so the processor cache hits:

```ts
import { parseMarkdown } from "@docvia/core";
import remarkSomePlugin from "remark-some-plugin";

// Build the array once, outside the per-document loop.
const remarkPlugins = [remarkSomePlugin];

async function parseAll(documents: readonly string[]) {
  return Promise.all(
    documents.map((body) => parseMarkdown(body, { remarkPlugins })),
  );
}
```

Wiring it into a transform, the way `@docvia/compiler` does:

```ts
import { parseMarkdown } from "@docvia/core";
import { transformToIR } from "@docvia/ir";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";

const { data, content } = extractFrontmatter(rawSource);
const frontmatter = validateFrontmatter(data, "guide/intro.md");
const { ast } = await parseMarkdown(content, { remarkPlugins });
const doc = transformToIR(ast, frontmatter, "guide/intro.md");
```
