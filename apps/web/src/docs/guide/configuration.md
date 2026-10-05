---
title: "Configuration"
description: "Every option accepted by defineConfig, with defaults and types."
eyebrow: "Guide"
order: 1
---

docvia is configured with a single `docvia.config.ts` file at your project
root. The CLI loads it (via [`loadConfig`](/docs/packages/plugins)), the Vite plugin
loads it from the Vite root when called as `docvia()`, and the Next.js wrapper
reads it on config evaluation.

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
| `sourceDir` | `string` | `"docs"` | Directory of Markdown source files. |
| `outDir` | `string` | `".docvia"` | Where the generated module graph is written. |
| `renderer` | `RendererAdapter` | none | Required at build time. Use `createReactRenderer(...)` or `createSvelteRenderer(...)`. |
| `plugins` | `docviaPlugin[]` | `[]` | Pipeline plugins, sorted by phase then priority. |
| `components` | `Record<string, ComponentConfig>` or an array of globs and `{ name, ...ComponentConfig }` | none | Components referenced by `:::name` directives. |
| `collections` | `CollectionConfig[]` | one default `docs` collection | One or more named source roots. |
| `frontmatter` | `StandardSchemaV1` | none | Extends the built-in frontmatter schema. Any Standard Schema library. |
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

The `renderer` field is required for `docvia build` to succeed; a build with
no renderer throws a `CONFIG_ERROR`. Choose the adapter that matches your app:

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

By default docvia compiles a single collection named `docs`, rooted at
`sourceDir` and served from `/`. Define `collections` to compile several named
source roots, for example separate guides and an API reference:

```ts
collections: [
  { name: "docs", sourceDir: "src/docs", baseUrl: "/" },
  { name: "api", sourceDir: "src/api", baseUrl: "/api", frontmatter: apiSchema },
  { name: "internal", sourceDir: "vendor/internal-docs", optional: true },
];
```

| Field | Description |
|---|---|
| `name` | A valid JS identifier. It becomes a named export of the source module. |
| `sourceDir` | The collection's root. May live outside the project root. |
| `baseUrl` | URL prefix for the collection's pages. |
| `frontmatter` | A Standard Schema for this collection. Defaults to the top-level `frontmatter`; its type flows into this collection's generated types. |
| `optional` | `true` makes a missing `sourceDir` an empty collection instead of an error (for example, a private submodule). |

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
as `frontmatter` to add typed fields. docvia validates every file against the
base fields plus your schema, and generates a typed `Frontmatter` for the
collection from the schema's output type. Set `frontmatter` on a collection to
give it its own schema.

```ts
import { defineConfig } from "@docvia/plugin-vite";
import { z } from "zod";

export default defineConfig({
  frontmatter: z.object({
    author: z.string(),
    publishedAt: z.string().optional(),
  }),
  // ...
});
```

A file that omits a required custom field now fails the build with a
`SCHEMA_ERROR` pointing at the offending file. See
[`@docvia/schema`](/docs/packages/schema) for the validation and codegen details.

## Components

Register components once under `components` and docvia generates the runtime
registry (`virtual:docvia/registry` on Vite, `docvia/registry` on Next.js), so
you do not repeat the wiring in every route.

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
  sourceDir: "src/docs",
  outDir: ".docvia",
  collections: [{ name: "docs", sourceDir: "src/docs", baseUrl: "/" }],
  renderer: createSvelteRenderer(),
  plugins: [
    shiki({ theme: "github-dark", langs: ["typescript", "svelte", "bash", "json"] }),
  ],
});
```
