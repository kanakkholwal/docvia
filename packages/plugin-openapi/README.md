# @docvia/plugin-openapi

OpenAPI for docvia: API reference pages generated from a spec, and inline endpoint blocks in Markdown.

- **Generated pages.** An overview and one page per operation, grouped by tag, in the same sidebar and search as your Markdown. Each page renders through a component you register, so it matches your site.
- **Code samples.** cURL, JavaScript, Python and Go by default, from [Scalar](https://github.com/scalar/scalar)'s `snippetz`.
- **Build time only.** Swagger 2.0 and OpenAPI 3.x (JSON or YAML) are parsed during the build. Operations load lazily, so a Worker or browser bundle holds only the pages it renders.

## Install

```bash
pnpm add -D @docvia/plugin-openapi
```

## Generated pages

```ts
// vite.config.ts
import { openapiModule } from "@docvia/plugin-openapi/vite";

export default defineConfig({
  plugins: [openapiModule({ spec: "openapi.yaml" })],
});
```

```ts
// src/lib/source.ts
import { openapiSource } from "@docvia/plugin-openapi/source";
import api from "virtual:docvia/openapi";

export const source = loader({
  baseUrl: "/docs",
  source: {
    files: [...docs.toDocviaSource().files, ...openapiSource(api, { dir: "api" }).files],
  },
});
```

Then register `APIOperation` (prop `operation`) and `APIOverview` (prop `api`) in your renderer's component registry.

## Inline blocks

```ts
// docvia.config.ts
import { openapi } from "@docvia/plugin-openapi";

export default defineConfig({ plugins: [openapi({ spec: "./openapi.yaml" })] });
```

````markdown
```openapi POST /pets
```
````

Full reference: https://docvia.dev/docs/packages/plugin-openapi
