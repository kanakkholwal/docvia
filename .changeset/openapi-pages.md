---
"@docvia/plugin-openapi": minor
---

Generate API reference pages from an OpenAPI spec.

- `openapiModule()` (`@docvia/plugin-openapi/vite`) builds the spec at build time into `virtual:docvia/openapi`: an index, plus one lazy chunk per operation.
- `openapiSource()` (`@docvia/plugin-openapi/source`) turns that into `loader()` pages: an overview and one page per operation, grouped by tag, with headings, a table of contents and search text. Pages render through `APIOperation` and `APIOverview` components you register.
- `buildApiDocument()` resolves the spec into a render-ready model: `$ref`s followed with schema names kept, cycles marked, `allOf` merged, Markdown rendered, examples generated, and code samples (cURL, JavaScript, Python, Go) from Scalar's `snippetz`.
- Request helpers in `./source` (`buildRequestUrl`, `buildRequestHeaders`, `defaultServer`, `missingParameters`, ...) for a framework-agnostic "Try it" playground; parameters carry their spec `example`.
- `createProxyHandler()` (`@docvia/plugin-openapi/proxy`): a same-origin proxy limited to the spec's servers, refusing private hosts, never passing cookies, with size and time limits. `sendRequest()` and `routeRequest()` route each playground request through it only when needed.
- Specs are parsed with Scalar's parser, so Swagger 2.0 and OpenAPI 3.0 and 3.1 all work; `js-yaml` is gone. Inline ` ```openapi` blocks now follow `$ref` request bodies and responses.
