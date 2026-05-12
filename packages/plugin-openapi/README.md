# @docvia/plugin-openapi

Render OpenAPI 3.x endpoints inline in your docvia Markdown.

Point the plugin at a spec file, then drop fenced ` ```openapi METHOD /path` blocks anywhere in your Markdown. Each block is replaced — at build time — with a fully rendered endpoint card: heading, description, parameters table, request and response samples. No runtime spec parsing ships to the browser.

## Install

```bash
pnpm add -D @docvia/plugin-openapi
```

## Configure

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

## Use

In any Markdown file:

````markdown
## List pets

```openapi GET /pets
```

## Create a pet

```openapi POST /pets
```
````

Each fenced block is replaced with the rendered endpoint, including parameter tables and JSON request/response samples synthesized from the spec's schemas.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `spec` | `string` | _required_ | Path to the OpenAPI 3.x spec. JSON, YAML, or YML. |
| `fenceLang` | `string` | `"openapi"` | Language tag the plugin looks for. Use `"api"` for ` ```api GET /pets`. |
| `onMissing` | `"throw" \| "warn"` | `"throw"` | Behaviour when a block references a path/method that isn't in the spec. |

## How it works

The plugin hooks `afterParse`. For each Markdown file, it walks the mdast tree, finds matching fenced blocks, and replaces them with structured mdast (heading + paragraph + table + code blocks). The rest of docvia's pipeline turns those nodes into IR, framework-native modules, and your renderer's output — exactly the same path as any hand-written Markdown.

The spec is hashed and contributes to the plugin's `cacheKey`, so when you change the spec, all pages that reference it are rebuilt.
