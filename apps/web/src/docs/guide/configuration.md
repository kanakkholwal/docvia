---
title: "Configuration"
description: "Every option accepted by defineConfig, with defaults and types."
eyebrow: "Guide"
order: 1
---

`docvia.config.ts` at your project root holds the compile settings: renderer,
plugins, components, and Markdown options. Collections are declared in code
with [`defineDocs()`](#collections). The Vite plugin loads the config from the
Vite root when called as `docvia()`, the Next.js wrapper reads it on config
evaluation, and the CLI loads it via [`loadConfig`](/docs/packages/plugins).

## defineConfig

Import `defineConfig` from your framework plugin: `@docvia/plugin-vite` or
`@docvia/plugin-next` (`@docvia/cli` re-exports it too, but the CLI is a
dev-only tool). It takes a `Partial<docviaConfig>`, fills in defaults, and
returns a fully resolved `docviaConfig`.

```ts
import { defineConfig } from "@docvia/plugin-vite";

export default defineConfig({
  /* ... */
});
```

Authoring the config through `defineConfig` is what gives you type-checking and
editor completion on every field.

## Top-level options

| Option | Type | Default | Description |
|---|---|---|---|
| `renderer` | `RendererAdapter` | none | Required. Use `createReactRenderer(...)` or `createSvelteRenderer(...)`. |
| `plugins` | `docviaPlugin[]` | `[]` | Pipeline plugins, sorted by phase then priority. |
| `components` | `Record<string, ComponentConfig>` or an array of globs and `{ name, ...ComponentConfig }` | none | Components referenced by `:::name` directives. |
| `hashExclude` | `string[]` | `[]` | Frontmatter keys left out of a page's `contentHash`, for derived or volatile values. |
| `markdown.remarkPlugins` | `unknown[]` | `[]` | Extra remark plugins inserted into the parse pipeline. |
| `theme.name` | `string` | `"default"` | UI theme name. |
| `theme.options` | `Record<string, unknown>` | `{}` | Theme-specific options. |

> **Syntax highlighting is a plugin.** Add
> [`@docvia/plugin-shiki`](/docs/packages/plugin-shiki) to `plugins` as
> `shiki({ theme, langs })`. It highlights every code block at build time and
> bakes the HTML into the IR, so no highlighter ships to the browser. It is the
> recommended default: without a highlighter, docvia warns once that code blocks
> render unhighlighted. Fence titles, tabs, and npm/pnpm/yarn/bun tabs need no
> config; see [Code blocks](/docs/packages/renderer-core#code-blocks).
>
> A `syntax` config block (`syntax.highlighter` / `syntax.theme` / `syntax.langs`)
> still exists in the config schema for backward compatibility, but it no longer
> drives highlighting. Configure the `shiki()` plugin instead.

## Renderers

The `renderer` field is required; compiling with no renderer throws a
`CONFIG_ERROR`. Choose the adapter that matches your app:

```ts
// React
import { createReactRenderer } from "@docvia/renderer-react";

renderer: createReactRenderer();
```

```ts
// Svelte: use the /node subpath, the build-time entry
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

renderer: createSvelteRenderer();
```

Syntax highlighting is no longer a renderer option. Add the
[`shiki()`](/docs/packages/plugin-shiki) plugin to `plugins` instead.

Both adapters accept `{ registry?, transform? }`. `transform(output, doc)`
rewrites the `RenderOutput` tree of each page before it is serialized:

```ts
renderer: createSvelteRenderer({
  transform: (output, doc) => output, // return a rewritten tree
});
```

See [`@docvia/renderer-react`](/docs/packages/renderer-react) and
[`@docvia/renderer-svelte`](/docs/packages/renderer-svelte) for the full adapter
API.

## Collections

A collection is a folder of Markdown, declared in a source file with
`defineDocs()` from `@docvia/source/macro`. The bundler plugin rewrites the call
at build time:

```ts title="lib/source.ts"
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "content/docs" });
const api = defineDocs({ dir: "content/api" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
export const apiSource = loader({ baseUrl: "/api", source: api.toDocviaSource() });
```

| Option | Description |
|---|---|
| `dir` | Folder relative to the project root, as a string literal. Defaults to `"content/docs"`. May live outside the project root. |
| `docs.schema` | A Standard Schema adding frontmatter fields. See [below](#extending-the-frontmatter-schema). |

`baseUrl` belongs to `loader()`, not the collection. See
[`@docvia/source`](/docs/packages/source) for the loader API and `meta.json`.

> Legacy config collections (`collections`, `sourceDir`, `outDir`, and a
> top-level `frontmatter` in this file) still work through
> `virtual:docvia/source` / `docvia/source`, but new apps should use
> `defineDocs()`.

## Built-in frontmatter

Every Markdown file may carry a YAML frontmatter block. docvia validates it
against this base schema:

| Field | Type | Default | Required |
|---|---|---|---|
| `title` | `string` | none | yes |
| `description` | `string` | `""` | no |
| `tags` | `string[]` | `[]` | no |
| `draft` | `boolean` | `false` | no |
| `order` | `number` | none | no |
| `slug` | `string` | derived from path | no |

Additional keys you write are preserved and available on `page.data`. They are
untyped unless you extend the schema.

## Extending the frontmatter schema

Pass a [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType, ...)
as `docs.schema` to add typed fields. docvia validates every file against the
base fields plus your schema, and `page.data` is typed from the schema's output
type. No type files are generated.

```ts
import { defineDocs } from "@docvia/source/macro";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: z.object({
      author: z.string(),
      publishedAt: z.string().optional(),
    }),
  },
});
```

A file that omits a required custom field fails the build with a
`SCHEMA_ERROR` pointing at the offending file. See
[`@docvia/schema`](/docs/packages/schema) for the validation and codegen details.

## Components

Register components once under `components`, then expose them to your routes
with `defineRegistry()`, which the bundler plugin rewrites into real imports:

```ts title="lib/registry.ts"
import { defineRegistry } from "@docvia/source/macro";

export const registry = defineRegistry();
```

```ts
// Array form: globs and explicit entries. Names come from file names:
// ButtonDemo.svelte becomes button-demo.
components: [
  "./src/lib/docs/*.svelte",
  { name: "counter", path: "./src/Counter.svelte", hydrate: true },
];

// Record form
components: {
  counter: {
    path: "./src/lib/components/Counter.svelte",
    hydrate: true,
    defaultProps: { initial: 0 },
  },
};
```

Each `ComponentConfig` has a `path`, an optional `hydrate` flag, and optional
`defaultProps`. Paths resolve from the project root (the config file's
directory), the extension may be omitted, and a missing file fails the compile
with a `CONFIG_ERROR`. A registered component is referenced from Markdown with
a `:::counter` directive.

## A complete example

```ts
import { defineConfig } from "@docvia/plugin-vite";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createSvelteRenderer(),
  components: {
    counter: { path: "./src/lib/components/Counter.svelte", hydrate: true },
  },
  plugins: [
    shiki({ theme: "github-dark", langs: ["typescript", "svelte", "bash", "json"] }),
  ],
});
```
