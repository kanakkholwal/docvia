---
title: "@docvia/schema"
description: "Frontmatter handling: YAML extraction, Zod-based validation, and TypeScript interface codegen."
eyebrow: "Packages"
order: 12
---

`@docvia/schema` owns everything related to **frontmatter** in docvia. It splits the YAML frontmatter block from a markdown file, validates it against a [Zod](https://zod.dev/) schema (extensible per project), and generates TypeScript type strings so the compiler can emit a precisely typed `Frontmatter` interface.

The package depends on `@docvia/ir` (for the `FrontmatterData` type and the `docviaError` class), [`yaml`](https://github.com/eemeli/yaml) for parsing, and `zod`. It imports Zod through the `zod/v3` compatibility entry so its behavior is pinned to the Zod v3 API surface regardless of the installed major version.

## Installation

```bash
pnpm add @docvia/schema
```

Requires Node.js `>=20.0.0`. ESM only.

## Exports

`@docvia/schema` exposes a single entry point.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.mjs` | `extractFrontmatter`, `validateFrontmatter`, `zodSchemaToFrontmatterTs`, `DocPageSchema`, and the `ExtractedFrontmatter` type. |

```ts
import {
  extractFrontmatter,
  validateFrontmatter,
  zodSchemaToFrontmatterTs,
  DocPageSchema,
} from "@docvia/schema";
import type { ExtractedFrontmatter } from "@docvia/schema";
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

The base Zod schema every docvia page is validated against. It is a `.passthrough()` object, so fields beyond the known ones are preserved rather than stripped.

```ts
const DocPageSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().default(""),
    slug: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    order: z.number().optional(),
  })
  .passthrough();
```

| Field | Zod rule | Resulting behavior |
| --- | --- | --- |
| `title` | `z.string().min(1)` | Required; empty strings rejected. |
| `description` | `z.string().default("")` | Optional input; defaults to `""`. |
| `slug` | `z.string().optional()` | Optional. |
| `tags` | `z.array(z.string()).default([])` | Optional input; defaults to `[]`. |
| `draft` | `z.boolean().default(false)` | Optional input; defaults to `false`. |
| `order` | `z.number().optional()` | Optional. |

### `validateFrontmatter`

```ts
function validateFrontmatter(
  raw: Record<string, unknown>,
  filePath?: string,
  extensionSchema?: z.ZodObject<z.ZodRawShape>,
): FrontmatterData
```

Validates a raw frontmatter object and returns a typed `FrontmatterData`.

| Parameter | Type | Description |
| --- | --- | --- |
| `raw` | `Record<string, unknown>` | The object returned by `extractFrontmatter` as `data`. |
| `filePath` | `string \| undefined` | File path attached to any thrown error for context. |
| `extensionSchema` | `z.ZodObject \| undefined` | An optional project schema merged into `DocPageSchema` before validation. |

When `extensionSchema` is supplied, it is merged into the base schema with `DocPageSchema.merge(extensionSchema)`, so project-defined fields are validated alongside the built-in ones. Validation runs through Zod's `safeParse`. On failure, a `docviaError` with code `SCHEMA_ERROR` is thrown; its message lists every issue as an indented `path: message` line, and the error carries `filePath` plus a `{ line: 1, column: 1 }` location. On success the validated, defaulted data is returned as `FrontmatterData`.

## TypeScript codegen

### `zodSchemaToFrontmatterTs`

```ts
function zodSchemaToFrontmatterTs(
  extensionSchema: z.ZodObject<z.ZodRawShape>,
): string
```

Converts a project's Zod extension schema into a TypeScript object-type literal string. The compiler emits this into `types.d.ts` so consumers get a precisely typed `Frontmatter` interface instead of the default union-of-literal-values inference.

The function first merges the extension schema with `DocPageSchema`, then walks every field of the merged shape and maps each Zod type to its TypeScript equivalent:

| Zod type | Emitted TypeScript | Optionality |
| --- | --- | --- |
| `ZodOptional` | inner type | field becomes optional (`?`) |
| `ZodDefault` | inner type | field stays **required** (a default always produces a value) |
| `ZodNullable` | `T \| null` | inherits inner optionality |
| `ZodString` | `string` | required |
| `ZodNumber` | `number` | required |
| `ZodBoolean` | `boolean` | required |
| `ZodLiteral` | the literal value (JSON-encoded) | required |
| `ZodEnum` | union of quoted members | required |
| `ZodArray` | `Array<T>` | required |
| `ZodUnion` | union of member types | required |
| anything else | `unknown` | required |

The output also appends an `[key: string]: unknown;` index signature, mirroring the open-ended shape of `FrontmatterData`. The result is a brace-delimited type literal such as:

```ts
{
  title: string;
  description: string;
  slug?: string;
  tags: Array<string>;
  draft: boolean;
  order?: number;
  author: string;
  category?: "guide" | "reference";
  [key: string]: unknown;
}
```

## Usage example

A complete extract-then-validate flow, including a project extension schema:

```ts
import { z } from "zod/v3";
import {
  extractFrontmatter,
  validateFrontmatter,
  zodSchemaToFrontmatterTs,
} from "@docvia/schema";
import { docviaError } from "@docvia/ir";

// Project-defined extra frontmatter fields.
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

// Generate the typed Frontmatter interface body for codegen.
const tsType = zodSchemaToFrontmatterTs(extensionSchema);
```
