---
title: "@docvia/plugin-vite"
description: "Vite plugins that transform docvia Markdown imports and resolve compiled docvia virtual modules."
eyebrow: "Packages"
order: 40
---

`@docvia/plugin-vite` provides two Vite plugins. `docviaMarkdownPlugin` transforms `*.md?docvia` imports into renderer output at build time. `docviaSourcePlugin` resolves the `docvia:source` and `docvia:registry` virtual modules to compiled `.docvia/` artifacts — with a stub fallback when they don't exist yet — and whitelists `.docvia` in Vite's `server.fs.allow`.

## Install

```bash
pnpm add -D @docvia/plugin-vite
```

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `docviaMarkdownPlugin`, `docviaSourcePlugin`. |

The package's `index.ts` re-exports `./markdown` and `./source`. There is no `bin` and no other subpath.

## API reference

### `docviaMarkdownPlugin`

```ts
function docviaMarkdownPlugin(config: docviaConfig): Plugin;
```

Returns a Vite plugin named `docvia:markdown` with a `transform(code, id)` hook.

It throws `Error("[docvia] No renderer configured")` at construction time if `config.renderer` is falsy — a Markdown plugin without a renderer cannot produce output.

The `transform` hook:

- Returns `null` (no transformation) unless `id` ends with `.md?docvia`.
- Otherwise runs the pipeline: `extractFrontmatter` → `validateFrontmatter` → `parseMarkdown` (with `config.markdown.remarkPlugins`) → `transformToIR` → `renderer.renderPage`.
- Returns `{ code, map }` — the renderer's output module and its source map.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { docviaMarkdownPlugin } from "@docvia/plugin-vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [docviaMarkdownPlugin(docviaConfig)],
});
```

```ts
// Importing a Markdown file with the ?docvia query triggers the transform.
import Page from "./docs/index.md?docvia";
```

### `docviaSourcePlugin`

```ts
function docviaSourcePlugin(): Plugin;
```

Returns a Vite plugin named `docvia:source` with `config`, `resolveId`, and `load` hooks. It takes no arguments.

#### `config()`

Pushes `path.resolve(root, ".docvia")` into `server.fs.allow`, so Vite's dev server is permitted to serve files from the compiled output directory.

#### `resolveId()`

Resolves two families of virtual module ids:

| Imported id | Resolves to (if file exists) | Fallback virtual id |
|---|---|---|
| `docvia:source`, `docvia/source`, `docvia-source` | `.docvia/source.ts` | `\0docvia:source` |
| `docvia:registry`, `docvia/registry`, `docvia-registry` | `.docvia/registry.ts` | `\0docvia:registry` |

When the compiled file exists on disk it is resolved directly. Otherwise the id is rewritten to a `\0`-prefixed virtual id so `load` can serve a stub.

#### `load()`

Returns stub module source for the virtual ids:

- `\0docvia:source` → a stub that calls `createSource({})` from `@docvia/source/internal` (an empty source with no collections).
- `\0docvia:registry` → a stub whose `resolve()` always returns `null`.

The stubs let your app type-check and boot before the first `docvia build` runs; once the real `.docvia/` artifacts exist, `resolveId` picks them up automatically.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { docviaSourcePlugin } from "@docvia/plugin-vite";

export default defineConfig({
  plugins: [docviaSourcePlugin()],
});
```

```ts
// Application code can import the virtual module regardless of build state.
import { source } from "docvia:source";
```

## Using both plugins together

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
  plugins: [
    docviaMarkdownPlugin(docviaConfig),
    docviaSourcePlugin(),
  ],
});
```
