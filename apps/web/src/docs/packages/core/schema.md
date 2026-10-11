---
title: "@docvia/core/schema"
description: "Frontmatter handling: YAML extraction, Standard Schema validation, and TypeScript type codegen."
eyebrow: "Packages"
order: 5
---

`@docvia/core/schema` owns everything related to **frontmatter** in docvia. It splits the YAML frontmatter block from a markdown file, validates it against a built-in [Standard Schema](https://standardschema.dev) (extensible per project with any compliant library), and generates TypeScript type strings so the compiler can emit a precisely typed `Frontmatter` type.

The package depends on `@docvia/core` (for the `FrontmatterData` type and the `docviaError` class), [`yaml`](https://github.com/eemeli/yaml) for parsing, and the type-only `@standard-schema/spec`. It has no runtime dependency on Zod.

## Installation

```bash
pnpm add @docvia/core
```

Requires Node.js `>=20.0.0`. ESM only.

## Exports

`@docvia/core/schema` exposes a single entry point.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.js` | `extractFrontmatter`, `validateFrontmatter`, `DocPageSchema`, the type codegen helpers, and the `ExtractedFrontmatter` and `BaseFrontmatter` types. |

```ts
import {
  extractFrontmatter,
  validateFrontmatter,
  DocPageSchema,
  composeFrontmatterType,
} from "@docvia/core/schema";
import type { BaseFrontmatter, ExtractedFrontmatter } from "@docvia/core/schema";
```

## Frontmatter extraction

### `ExtractedFrontmatter`

```ts
interface ExtractedFrontmatter {
  readonly data: Record<string, unknown>;
  readonly content: string;
  readonly bodyOffset: number;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `data` | `Record<string, unknown>` | The parsed YAML object. Empty when the file has no frontmatter. |
| `content` | `string` | The markdown body with the frontmatter block removed. |
| `bodyOffset` | `number` | The 1-based line number where the body begins, for accurate error reporting. |

### `extractFrontmatter`

```ts
function extractFrontmatter(raw: string): ExtractedFrontmatter
```

Splits a raw file string into its frontmatter object and markdown body. The algorithm:

1. Splits the input into lines, tolerating both `\n` and `\r\n` line endings.
2. If the first non-empty line is not exactly `---`, the file is treated as having **no frontmatter**: `data` is `{}`, `content` is the whole input, and `bodyOffset` is `1`.
3. Otherwise it scans for the closing `---` delimiter.
4. The YAML between the delimiters is parsed with the `yaml` package.
5. The body is everything after the closing delimiter; `bodyOffset` is set to the line where it starts.

Edge cases:

- An empty or whitespace-only frontmatter block yields `data: {}` and the body that follows.
- If the parsed YAML is not an object (for example, a bare scalar), `data` falls back to `{}`.

Failure modes, both of which throw a `docviaError` with code `SCHEMA_ERROR`:

| Condition | Error message | Location |
| --- | --- | --- |
| Opening `---` with no closing `---` | `Unclosed frontmatter: missing closing ---` | line 1, column 1 |
| Malformed YAML between the delimiters | `Invalid YAML in frontmatter: <reason>` | line 2, column 1 |

The YAML-parse error also chains the underlying parser error through `docviaError.cause`.

## Schema and validation

### `DocPageSchema`

The base validator every docvia page runs through. It is a dependency-free [Standard Schema](https://standardschema.dev), so fields beyond the known ones pass through rather than being stripped.

```ts
const DocPageSchema: StandardSchemaV1<Record<string, unknown>, BaseFrontmatter>;

interface BaseFrontmatter {
  readonly title: string;
  readonly description: string;
  readonly slug?: string;
  readonly tags: readonly string[];
  readonly draft: boolean;
  readonly order?: number;
  readonly [key: string]: unknown;
}
```

| Field | Rule | Resulting behavior |
| --- | --- | --- |
| `title` | non-empty string | Required; empty strings rejected. |
| `description` | string | Optional input; defaults to `""`. |
| `slug` | string | Optional. |
| `tags` | array of strings | Optional input; defaults to `[]`. |
| `draft` | boolean | Optional input; defaults to `false`. |
| `order` | number | Optional. |

### `validateFrontmatter`

```ts
function validateFrontmatter(
  raw: Record<string, unknown>,
  filePath?: string,
  extensionSchema?: StandardSchemaV1,
): FrontmatterData
```

Validates a raw frontmatter object and returns a typed `FrontmatterData`.

| Parameter | Type | Description |
| --- | --- | --- |
| `raw` | `Record<string, unknown>` | The object returned by `extractFrontmatter` as `data`. |
| `filePath` | `string \| undefined` | File path attached to any thrown error for context. |
| `extensionSchema` | `StandardSchemaV1 \| undefined` | An optional project schema from any Standard Schema library (Zod, Valibot, ArkType, ...). |

The base fields are validated first, then `extensionSchema` runs over the same raw object; its output wins for overlapping keys. Issues from both are reported together. On failure, a `docviaError` with code `SCHEMA_ERROR` is thrown; its message lists every issue as an indented `path: message` line, and the error carries `filePath` plus a `{ line: 1, column: 1 }` location. A schema whose `validate` returns a promise is rejected, since frontmatter validation is synchronous.

## TypeScript codegen

The compiler emits a `Frontmatter` type per collection into `types.d.ts`. The schema's output type is read from its compile-time `~standard.types`, so no runtime introspection is involved and every Standard Schema library types correctly.

| Export | Purpose |
| --- | --- |
| `BASE_FRONTMATTER_TYPE` | The built-in fields as a TypeScript type literal. |
| `inferSchemaOutput(schemaRef)` | Wraps a type reference to a schema in `NonNullable<S["~standard"]["types"]>["output"]`. |
| `composeFrontmatterType(schemaOutput?)` | Base fields intersected with the schema output (or `Record<string, unknown>`) and an index signature, wrapped in `Jsonify<...>`. |
| `JSONIFY_TYPE_NAME`, `JSONIFY_TYPE_DECL` | The `Jsonify` helper. Page `meta` is serialized with `JSON.stringify`, so a `Date` field types as `string`. |

## Usage example

A complete extract-then-validate flow, including a project extension schema:

```ts
import { z } from "zod";
import { extractFrontmatter, validateFrontmatter } from "@docvia/core/schema";
import { docviaError } from "@docvia/core";

// Project-defined extra frontmatter fields. Any Standard Schema works.
const extensionSchema = z.object({
  author: z.string(),
  category: z.enum(["guide", "reference"]).optional(),
});

function processFile(rawSource: string, filePath: string) {
  try {
    const { data, content } = extractFrontmatter(rawSource);
    const frontmatter = validateFrontmatter(data, filePath, extensionSchema);
    return { frontmatter, content };
  } catch (err) {
    if (err instanceof docviaError && err.code === "SCHEMA_ERROR") {
      console.error(`Frontmatter problem in ${filePath}:\n${err.message}`);
    }
    throw err;
  }
}
```
