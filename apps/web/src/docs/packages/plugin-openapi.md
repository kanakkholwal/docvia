---
title: "@docvia/plugin-openapi"
description: "API reference pages generated from an OpenAPI spec, with code samples, plus inline endpoint blocks in Markdown."
eyebrow: "Packages"
order: 42
---

`@docvia/plugin-openapi` turns an OpenAPI spec into docs. It does two things:

- **Generated pages.** One page per operation, grouped by tag, with an overview page, in the same sidebar and search as your Markdown. You render them with your own components. See the [API reference example](/docs/api-example) built from a sample spec.
- **Inline blocks.** A ` ```openapi METHOD /path` fence in any Markdown page becomes a rendered endpoint.

The spec is parsed at build time. Swagger 2.0, OpenAPI 3.0 and 3.1, in JSON or YAML, are read with [Scalar's parser](https://github.com/scalar/scalar) and upgraded to 3.1. Code samples come from Scalar's `snippetz`. Nothing that parses OpenAPI ships to the browser or a Worker.

## Install

```bash
pnpm add -D @docvia/plugin-openapi
```

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `buildApiDocument`, `loadSpec`, `parseSpec`, `openapi` (the inline-block plugin), `DEFAULT_SAMPLES`, and the model and spec types. Node only. |
| `./source` | `openapiSource`, `apiSource`, `apiIndex`, `operationSections`, the request helpers for a playground, and the model types. No Node APIs, so it runs in the browser and in Workers. |
| `./vite` | `openapiModule`, the Vite plugin that builds the spec into a module. |
| `./proxy` | `createProxyHandler`, a same-origin proxy for the playground, plus `isAllowedTarget` and `isPrivateHost`. Web `Request` in, `Response` out, so it runs in Workers, Node and Bun. |

## Generated pages

Three steps: build the spec into a module, add its pages to your docs source, and register two components.

### 1. Build the spec with Vite

```ts
// vite.config.ts
import { openapiModule } from "@docvia/plugin-openapi/vite";

export default defineConfig({
  plugins: [
    // ...sveltekit(), docvia()
    openapiModule({
      spec: "openapi.yaml",
      // Optional: highlight samples and examples at build time.
      highlight: (code, lang) => highlighter.codeToHtml(code, { lang, theme: "github-dark" }),
    }),
  ],
});
```

`virtual:docvia/openapi` default-exports an `ApiSource`: the list of operations up front, and each operation's details as a separate lazy chunk. A server bundle that only needs the page list, like a search endpoint, never loads an operation. Editing the spec reloads the page in dev.

### 2. Add the pages to `loader()`

```ts
// src/lib/source.ts
import { openapiSource } from "@docvia/plugin-openapi/source";
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";
import api from "virtual:docvia/openapi";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({
  baseUrl: "/docs",
  source: {
    files: [
      ...docs.toDocviaSource().files,
      ...openapiSource(api, { dir: "api", baseUrl: "/docs" }).files,
    ],
  },
});
```

This gives `/docs/api` (the overview), `/docs/api/<tag>/<operation>` for each operation, and a sidebar folder per tag. Pages are named after `operationId`, or the method and path when there is none.

| Option | Default | Description |
|---|---|---|
| `dir` | `"api"` | Folder the pages live under, inside the docs collection. |
| `baseUrl` | `"/docs"` | The `loader()` base URL, for the overview's links. |
| `title` | the spec's `info.title` | Title of the overview page and the sidebar folder. |
| `components` | `{ operation: "APIOperation", overview: "APIOverview" }` | Registry names the pages render through. |

Each page's data carries `openapi: { method, path, deprecated }`, so a route can tell generated pages from Markdown ones, for example to point an "edit this page" link at the spec. Headings, the table of contents and search text are filled in for every page.

### 3. Register the components

A page's content is a single component node: `APIOperation` with an `operation` prop (an `ApiOperation`), or `APIOverview` with an `api` prop. Supply both through your renderer's component registry:

```ts
import ApiOperation from "$lib/components/openapi/api-operation.svelte";
import ApiOverview from "$lib/components/openapi/api-overview.svelte";

export const registry: ComponentRegistry = {
  resolve: (name) =>
    name === "APIOperation" ? { component: ApiOperation }
    : name === "APIOverview" ? { component: ApiOverview }
    : null,
};
```

The components are yours, so the pages match your site. This site's are built from [baby-ui](https://baby-ui.nexonauts.com) components and live in `apps/web/src/lib/components/openapi/`. Give the section headings the ids from `operationSections(operation)` so the table of contents links work.

### A request playground

The [example pages](/docs/api-example/pets/list-pets) have a **Try it** panel that sends the request from the browser. The panel is a component of the site; the package supplies the parts that are the same in any framework:

| Helper | Does |
|---|---|
| `defaultServer(operation, origin)` | Picks the first server on the page's own origin, else the first listed. A browser can always reach its own origin; other servers must allow it through CORS. |
| `resolveServerUrl(server, origin)` | Resolves a relative server URL such as `/api/v1`. |
| `buildRequestUrl(operation, server, values)` | Fills path parameters and appends non-empty query parameters. |
| `buildRequestHeaders(operation, values, auth, credentials, contentType)` | Header parameters plus credentials, each where its scheme expects it: `Bearer`, `Basic` (typed as `user:password`), or an API key in a header or the query. |
| `missingParameters(operation, values)` | Required path, query and header parameters still empty. |
| `prettyBody(text, contentType)` | Re-indents a JSON response. |

Form values are keyed by `paramKey(location, name)` and prefilled from each parameter's `example`. This site keeps credentials in memory for the visit and never stores them. Its example spec lists a stateless mock of the API, served by the same Worker, so every request has somewhere to go.

### A same-origin proxy

A browser can only call another origin if that server allows it (CORS), and most APIs don't allow docs sites. `createProxyHandler` gives the playground a same-origin endpoint that forwards to the spec's own servers:

```ts
// src/routes/api-reference/proxy/+server.ts
import { createProxyHandler } from "@docvia/plugin-openapi/proxy";

const proxy = createProxyHandler({ servers: ["https://api.example.com/v1"] });
export const GET = ({ request }) => proxy(request);
export const POST = GET; // and PUT, PATCH, DELETE, HEAD, OPTIONS
```

It is not an open proxy:

- **Spec servers only.** A target must sit under one of `servers`, same origin and inside its path. Anything else is `403`.
- **No private hosts.** Loopback, private and link-local addresses and local names are refused even if the spec lists them.
- **No cookies.** `Cookie` is never forwarded and `Set-Cookie` never comes back. Redirects are returned, not followed.
- **Bounded.** Request bodies are capped at 1 MB, responses at 5 MB and the upstream call at 30 s; all three are options.

`sendRequest(request, origin, { path, servers })` picks the route for each request: same-origin URLs go direct, spec servers go through the proxy, and anything else (a draft to another API) goes direct and needs CORS. `routeRequest` exposes that decision on its own.

This site's [API workspace](/api-reference) is built on it: requests in tabs, a sidebar of operations with search, drafts to any URL, and per-request history, all kept in the browser.

### The model

`buildApiDocument(doc, options)` resolves a spec into plain JSON:

- **References followed.** `$ref`s to parameters, request bodies, responses, examples and schemas are resolved. A schema keeps its component name (`Pet`), and a schema that refers back to itself is marked `circular` instead of expanding forever.
- **Schemas flattened for display.** `allOf` is merged into one set of fields; `oneOf` and `anyOf` become `variants`. Each schema has a display `type` (`array<Pet>`, `string<date>`, `string | null`), `enum`, `default`, and readable `constraints` (`>= 1`, `max length 64`).
- **Markdown rendered.** Descriptions are CommonMark rendered to HTML, with any raw HTML in the spec escaped.
- **Examples.** Request and response examples use the spec's own `example` or `examples` when present. Otherwise one is generated from the schema, leaving out `readOnly` fields in requests and `writeOnly` fields in responses.
- **Code samples.** cURL, JavaScript, Python and Go by default; pass `samples` to choose others from any `snippetz` target. Samples fill in path parameters that have examples and show where credentials go (`Bearer <token>`, `X-Api-Key: <api-key>`).
- **Authorization.** `security` is resolved per operation, honoring an operation's `security: []` as "no auth".

## Inline blocks

For an endpoint in the middle of a guide, add the compiler plugin and write a fence:

```ts
// docvia.config.ts
import { openapi } from "@docvia/plugin-openapi";

export default defineConfig({
  plugins: [openapi({ spec: "./openapi.yaml" })],
});
```

````markdown
## Create a pet

```openapi POST /pets
```
````

Each block becomes Markdown: a heading, the summary and description, a parameter table, and request and response samples. The method is parsed case-insensitively.

| Option | Type | Default | Description |
|---|---|---|---|
| `spec` | `string` | _required_ | Path to the spec, resolved against the working directory. |
| `fenceLang` | `string` | `"openapi"` | The fence language to match. Use `"api"` for ` ```api GET /pets`. |
| `onMissing` | `"throw" \| "warn"` | `"throw"` | What happens when a block has no `METHOD /path` header or names an operation the spec lacks. `"warn"` logs and leaves the block as is. |

The spec's content hash is part of the plugin's `cacheKey()`, so editing the spec rebuilds every page that uses it.

## Caveats

- **Internal references only.** `$ref`s into other files or URLs are not followed; they show the referenced name.
- **Drafts are limited by CORS.** The proxy only reaches the spec's servers, so a request to any other host goes straight from the browser.
- **Spec errors fail the build.** A spec that can't be read or parsed raises a `docviaError` with code `CONFIG_ERROR`. A bad inline block raises `PLUGIN_ERROR` when `onMissing` is `"throw"`.
