---
title: "Configuration"
description: "Every option accepted by defineConfig, with defaults and types."
eyebrow: "Guide"
order: 1
---

docvia is configured with a single `docvia.config.ts` file at your project
root. The CLI loads it (via [`loadConfig`](/packages/plugins)), the Vite plugin
imports it directly, and the Next.js wrapper reads it on config evaluation.

## defineConfig

`defineConfig` is re-exported from both `@docvia/cli` and `@docvia/plugins`. It
takes a `Partial<docviaConfig>`, fills in defaults, and returns a fully
resolved `docviaConfig`.

```ts
import { defineConfig } from "@docvia/cli";

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
| `renderer` | `RendererAdapter` | — | Required at build time. Use `createReactRenderer(...)` or `createSvelteRenderer(...)`. |
| `plugins` | `docviaPlugin[]` | `[]` | Pipeline plugins, sorted by phase then priority. |
| `components` | `Record<string, ComponentConfig>` | — | Components referenced by `:::name` directives. |
| `collections` | `CollectionConfig[]` | one default `docs` collection | One or more named source roots. |
| `frontmatter` | `z.ZodObject` | — | Extends the built-in frontmatter schema. |
| `markdown.remarkPlugins` | `unknown[]` | `[]` | Extra remark plugins inserted into the parse pipeline. |
| `syntax.highlighter` | `"shiki" \| "prism"` | `"shiki"` | Syntax highlighter backend. |
| `syntax.theme` | `string` | `"github-dark"` | Highlighter theme name. |
| `syntax.langs` | `string[]` | 7 common languages | Languages preloaded into the highlighter. |
| `theme.name` | `string` | `"default"` | UI theme name. |
| `theme.options` | `Record<string, unknown>` | `{}` | Theme-specific options. |

The default `syntax.langs` set is `javascript`, `typescript`, `bash`, `json`,
`css`, `html`, `svelte`.

> **Recommended: highlight with a plugin.** The current approach to syntax
> highlighting is the [`@docvia/plugin-shiki`](/packages/plugin-shiki) plugin —
> add `shiki({ theme, langs })` to `plugins`. It highlights at build time and
> bakes the HTML into the IR, so no highlighter ships to the browser. The
> `syntax.*` options and the renderer `highlighter` argument below remain as a
> fallback for projects without a highlighter plugin.

## Renderers

The `renderer` field is required for `docvia build` to succeed — a build with
no renderer throws a `CONFIG_ERROR`. Choose the adapter that matches your app:

```ts
// React
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

renderer: createReactRenderer({
  highlighter: createShikiHighlighter({ theme: "github-dark" }),
});
```

```ts
// Svelte — note the /node subpath, the build-time entry
import { createSvelteRenderer, createShikiHighlighter } from "@docvia/renderer-svelte/node";

renderer: createSvelteRenderer({
  highlighter: createShikiHighlighter({ theme: "github-dark" }),
});
```

See [`@docvia/renderer-react`](/packages/renderer-react) and
[`@docvia/renderer-svelte`](/packages/renderer-svelte) for the full adapter
API.

## Collections

By default docvia compiles a single collection named `docs`, rooted at
`sourceDir` and served from `/`. Define `collections` to compile several named
source roots — for example, separate guides and an API reference:

```ts
collections: [
  { name: "docs", sourceDir: "src/docs", baseUrl: "/" },
  { name: "api", sourceDir: "src/api", baseUrl: "/api" },
];
```

Each `CollectionConfig` has a `name`, a `sourceDir`, and an optional `baseUrl`
prefix. The generated `source.ts` exports one collection helper per entry.

## Built-in frontmatter

Every Markdown file may carry a YAML frontmatter block. docvia validates it
against this base schema:

| Field | Type | Default | Required |
|---|---|---|---|
| `title` | `string` | — | yes |
| `description` | `string` | `""` | no |
| `tags` | `string[]` | `[]` | no |
| `draft` | `boolean` | `false` | no |
| `order` | `number` | — | no |
| `slug` | `string` | derived from path | no |

The base schema uses `.passthrough()`, so any additional keys you write are
preserved and available on `page.data` — they are simply untyped unless you
extend the schema.

## Extending the frontmatter schema

Pass a Zod object as `frontmatter` to add typed fields. docvia merges it with
the base schema, validates every file against the result, and generates a
typed `Frontmatter` interface for the collection.

```ts
import { defineConfig } from "@docvia/cli";
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
[`@docvia/schema`](/packages/schema) for the validation and codegen details.

## Components

Register components once under `components` and docvia generates the runtime
registry — you do not repeat the wiring in every route.

```ts
components: {
  counter: {
    path: "./src/lib/components/Counter.svelte",
    hydrate: true,
    defaultProps: { initial: 0 },
  },
};
```

Each `ComponentConfig` has a `path`, an optional `hydrate` flag, and optional
`defaultProps`. A registered component is referenced from Markdown with a
`:::counter` directive.

## A complete example

```ts
import { defineConfig } from "@docvia/cli";
import {
  createShikiHighlighter,
  createSvelteRenderer,
} from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  outDir: ".docvia",
  collections: [{ name: "docs", sourceDir: "src/docs", baseUrl: "/" }],
  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["typescript", "svelte", "bash", "json"],
    }),
  }),
});
```
