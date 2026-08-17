---
title: "@docvia/plugin-openapi"
description: "Compiler plugin that renders OpenAPI 3.x operations inline from fenced Markdown blocks."
eyebrow: "Packages"
order: 42
---

`@docvia/plugin-openapi` is a docvia compiler plugin that renders OpenAPI 3.x operations inline in your Markdown. Point it at a spec file, then drop fenced ` ```openapi METHOD /path` blocks anywhere in your docs. Each block is replaced at build time with a fully rendered endpoint: heading, description, parameter table, and request/response samples. No runtime spec parsing ships to the browser.

## Install

```bash
pnpm add -D @docvia/plugin-openapi
```

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `openapi`, `OpenAPIPluginOptions`, and the OpenAPI 3.x type definitions. |

There is no `bin` and no other subpath.

## Configure

Add `openapi()` to the `plugins` array of your `docvia.config.ts`:

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/cli";
import { openapi } from "@docvia/plugin-openapi";
import { createReactRenderer } from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [
    openapi({ spec: "./openapi.yaml" }),
  ],
});
```

## API reference

### `interface OpenAPIPluginOptions`

```ts
interface OpenAPIPluginOptions {
  readonly spec: string;
  readonly fenceLang?: string;
  readonly onMissing?: "throw" | "warn";
}
```

| Option | Type | Default | Behavior |
|---|---|---|---|
| `spec` | `string` | _required_ | Path to the OpenAPI 3.x spec. `.json`, `.yaml`, and `.yml` are detected by extension. Resolved relative to the current working directory. |
| `fenceLang` | `string` | `"openapi"` | The fence language tag the plugin matches. Use `"api"` to match ` ```api GET /pets`. |
| `onMissing` | `"throw" \| "warn"` | `"throw"` | What happens when a block references a path/method absent from the spec, or has an unparseable header. `"throw"` fails the build; `"warn"` logs and leaves the original block in place. |

### `openapi`

```ts
function openapi(options: OpenAPIPluginOptions): docviaPlugin;
```

Creates the plugin. The returned `docviaPlugin` has:

| Property | Value |
|---|---|
| `name` | `"@docvia/plugin-openapi"` |
| `version` | `"0.1.0"` |
| `phase` | `"normal"` |
| `priority` | `100` |

- `cacheKey()` returns `@docvia/plugin-openapi@<specHash>:<fenceLang>`. The spec content hash is folded into the key, so changing the spec rebuilds every page that references it.
- The spec is loaded lazily and cached. Loading is kicked off eagerly at plugin construction (so the first file doesn't pay the full cost) but never throws synchronously, because config evaluation must stay sync.
- `afterParse` loads the spec and transforms matching code nodes in place.

### Type definitions

The package also exports a minimal set of OpenAPI 3.x types, covering only the fields the renderer reads. Unknown fields are preserved as `unknown`, keeping the types forward-compatible with 3.1.

#### `HttpMethod`

```ts
type HttpMethod =
  | "get" | "post" | "put" | "patch"
  | "delete" | "options" | "head" | "trace";
```

#### `OpenAPIDocument`

```ts
interface OpenAPIDocument {
  readonly openapi?: string;
  readonly info?: OpenAPIInfo;
  readonly servers?: readonly { readonly url: string }[];
  readonly paths?: Readonly<Record<string, OpenAPIPathItem>>;
  readonly components?: { readonly schemas?: Readonly<Record<string, OpenAPISchema>> };
  readonly [key: string]: unknown;
}
```

#### `OpenAPIInfo`

```ts
interface OpenAPIInfo {
  readonly title?: string;
  readonly version?: string;
  readonly description?: string;
}
```

#### `OpenAPIPathItem`

```ts
type OpenAPIPathItem = Partial<Record<HttpMethod, OpenAPIOperation>> & {
  readonly parameters?: readonly OpenAPIParameterOrRef[];
};
```

#### `OpenAPIOperation`

```ts
interface OpenAPIOperation {
  readonly summary?: string;
  readonly description?: string;
  readonly operationId?: string;
  readonly tags?: readonly string[];
  readonly deprecated?: boolean;
  readonly parameters?: readonly OpenAPIParameterOrRef[];
  readonly requestBody?: OpenAPIRequestBody;
  readonly responses?: Readonly<Record<string, OpenAPIResponse>>;
}
```

#### `OpenAPIParameter`

```ts
interface OpenAPIParameter {
  readonly name: string;
  readonly in: "query" | "path" | "header" | "cookie";
  readonly description?: string;
  readonly required?: boolean;
  readonly schema?: OpenAPISchema;
}
```

#### `OpenAPIRequestBody`

```ts
interface OpenAPIRequestBody {
  readonly description?: string;
  readonly required?: boolean;
  readonly content?: Readonly<Record<string, OpenAPIMediaType>>;
}
```

#### `OpenAPIResponse`

```ts
interface OpenAPIResponse {
  readonly description?: string;
  readonly content?: Readonly<Record<string, OpenAPIMediaType>>;
}
```

#### `OpenAPIMediaType`

```ts
interface OpenAPIMediaType {
  readonly schema?: OpenAPISchema;
  readonly example?: unknown;
  readonly examples?: Readonly<
    Record<string, { readonly value?: unknown; readonly summary?: string }>
  >;
}
```

#### `OpenAPISchema`

```ts
interface OpenAPISchema {
  readonly type?: string;
  readonly format?: string;
  readonly enum?: readonly unknown[];
  readonly items?: OpenAPISchema;
  readonly properties?: Readonly<Record<string, OpenAPISchema>>;
  readonly required?: readonly string[];
  readonly example?: unknown;
  readonly $ref?: string;
  readonly [key: string]: unknown;
}
```

## Authoring blocks

In any Markdown file, write a fenced block whose language tag is `fenceLang` (default `openapi`) and whose info string carries a `METHOD /path` header:

````markdown
## List pets

```openapi GET /pets
```

## Create a pet

```openapi POST /pets
```
````

The header is parsed case-insensitively (`GET`, `get`, `Post` all work). A block whose meta is missing or doesn't match the `METHOD /path` shape, or whose operation is absent from the spec, triggers the `onMissing` behavior.

## How it works

The plugin hooks `afterParse`. For each Markdown file it walks the mdast tree and replaces every `code` node whose `lang` equals `fenceLang` with a sequence of structured mdast block nodes. The rest of docvia's pipeline turns those nodes into IR, framework-native modules, and rendered output, along exactly the same path as hand-written Markdown.

## What is rendered

For each matched block, the plugin emits the following mdast in order:

- **Heading.** An `h3` of the form **`METHOD`** ` /path` (method bolded, path as inline code).
- **Summary.** The operation's `summary`, rendered as a bold paragraph (when present).
- **Description.** The operation's `description`, as a paragraph (when present).
- **Deprecated callout.** When `deprecated` is true, a blockquote: _"**Deprecated.** This endpoint will be removed in a future version."_
- **Parameters.** An `h4` "Parameters" heading followed by a table with columns **Name**, **In**, **Type**, **Required**, **Description** (only when the operation declares parameters). `In` is the parameter location (`query`, `path`, `header`, `cookie`); `Required` renders as `yes` / `no`.
- **Request body.** An `h4` "Request body" heading, the body description (when present), and one code sample per media type. Each media type emits a paragraph naming the content type (e.g. `application/json`) followed by a fenced code block.
- **Responses.** An `h4` "Responses" heading, then for each status code (sorted ascending) a bold-status paragraph with the response description and one code sample per media type.
- A trailing **thematic break** (`---`).

Code-block languages are inferred from the media type: types containing `json` → `json`, `xml` → `xml`, `yaml`/`yml` → `yaml`, `html` → `html`, `text` → `text`, otherwise `text`.

## Schema example synthesis

When a media type provides an `example` (or an `examples` map, where the first entry's `value` is used), that value is rendered verbatim. When it provides neither, the plugin **synthesizes** a sample from the schema shape:

| Schema | Synthesized value |
|---|---|
| `string` | `"string"` |
| `string` with `format: date-time` | current time as an ISO string |
| `string` with `format: uuid` | the all-zero UUID `00000000-0000-0000-0000-000000000000` |
| `integer` / `number` | `0` |
| `boolean` | `true` |
| `enum` | the first enum value |
| `array` | a one-element array, recursing into `items` |
| `object` | an object with each property synthesized recursively |

Internal `#/components/schemas/...` `$ref`s are resolved before synthesis. Reference cycles short-circuit to `null`. When a `$ref` cannot be resolved, the type falls back to the ref's final path segment (the schema name).

### Example

Given this schema:

```yaml
components:
  schemas:
    Pet:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
        tag: { type: string }
```

A `GET /pets` operation responding with an array of `Pet` and no explicit example renders a JSON sample like:

```json
[
  {
    "id": 0,
    "name": "string",
    "tag": "string"
  }
]
```

## Caveats

- **External and cross-file `$ref`s are not dereferenced.** Only internal `#/...` refs are resolved; anything else falls back to the ref name.
- **Security schemes, server lists, and response headers are not surfaced.** The renderer only covers summary/description, parameters, request body, and responses.
- The plugin **only works inside docvia's `compile` pipeline.** It is a compiler plugin, not a standalone Markdown transformer.
- Spec read or parse errors raise a `docviaError` with code `CONFIG_ERROR`; a missing/unparseable block header or absent operation raises `PLUGIN_ERROR` when `onMissing` is `"throw"`.
