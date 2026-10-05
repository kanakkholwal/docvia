# docvia

A Markdown documentation compiler. docvia turns a folder of Markdown into
typed, pre-rendered content for React, Svelte, or any framework with a renderer
adapter. Collections are declared in code with `defineDocs()` and read through a
fumadocs-style `loader()`:

- **Indexed at build time.** The bundler plugin rewrites `defineDocs()` into an
  index of the folder's pages (frontmatter only), so nothing is scanned at runtime.
- **Compiled on demand.** A page body compiles the first time `page.data.load()`
  runs, in memory, keyed by content hash. Nothing is written to disk.
- **Same imports everywhere.** Plain package subpaths, identical in Vite
  (SvelteKit, React + Vite, TanStack Start) and Next.js (webpack + Turbopack).

## Why docvia

- **IR-based.** Markdown is parsed, sanitized, and transformed into an
  Intermediate Representation once; renderers turn that IR into framework output.
- **Typed frontmatter.** Extend the built-in schema with any Standard Schema
  (Zod, Valibot, ArkType, ...) and page data is typed from it.
- **Lazy.** Page bodies stay out of the server bundle until requested, so SSR
  cold start stays small (Cloudflare Workers included).
- **Pluggable.** Five hook points across the pipeline, plus build-time syntax
  highlighting that bakes HTML into the IR so no highlighter ships to the browser.
- **Framework adapters.** First-party React and Svelte renderers, an in-process
  Vite plugin, and a Next.js wrapper (webpack + Turbopack).

## Install

```bash
pnpm add -D @docvia/plugin-vite   # or @docvia/plugin-next
pnpm add @docvia/source @docvia/renderer-react   # or @docvia/renderer-svelte
```

## Quick start

`docvia.config.ts` holds the renderer, plugins, components, and Markdown options:

```ts
import { defineConfig } from "@docvia/plugin-vite"; // or @docvia/plugin-next
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  renderer: createReactRenderer(),
  plugins: [shiki({ theme: "github-dark" })],
});
```

Declare the collection in code:

```ts
// lib/source.ts (SvelteKit: src/lib/source.ts)
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  // Optional: extra frontmatter fields, any Standard Schema library.
  docs: { schema: z.object({ author: z.string().optional() }) },
});

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

```ts
// lib/registry.ts: components from `components` in docvia.config.ts
import { defineRegistry } from "@docvia/source/macro";

export const registry = defineRegistry();
```

Read pages with the same method names as fumadocs `loader()`:

```ts
const page = source.getPage(["getting-started"]); // sync, frontmatter only
if (!page) notFound();
const { content, toc, headings, manifest, structuredData } = await page.data.load();

source.getPages();       // every page
source.pageTree;         // navigation tree (also source.getPageTree())
source.generateParams(); // [{ slug: [...] }] for static generation
```

Each folder can hold a `meta.json` (`title`, `pages`, `defaultOpen`, `root`).
`pages` accepts names, `...` (the rest), `---Separator---`, `!exclude`, and
`[Text](url)` links.

## Framework integration

docvia runs **in-process** inside your bundler: no separate build step, and
changed pages recompile on HMR.

### SvelteKit (Vite)

```bash
pnpm add -D @docvia/plugin-vite
pnpm add @docvia/renderer-svelte @docvia/source
```

```ts
// vite.config.ts (SvelteKit 3: no svelte.config.js)
import { docvia } from "@docvia/plugin-vite";
import adapter from "@sveltejs/adapter-auto";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() }), docvia()], // docvia() loads docvia.config.ts
});
```

`docvia()` rewrites every module that imports `@docvia/source/macro` and
configures `ssr.noExternal` and `optimizeDeps` for the renderer. The config must
use the Svelte renderer (`createSvelteRenderer` from `@docvia/renderer-svelte/node`).
Load pages in a catch-all route:

```ts
// src/routes/docs/[...slug]/+page.server.ts
import { error } from "@sveltejs/kit";
import { source } from "$lib/source";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const page = source.getPage(params.slug?.split("/").filter(Boolean));
  if (!page) error(404, "Page not found");
  const { content, headings } = await page.data.load();
  return { page: { title: page.data.title, content, headings } };
};
```

Render `content` with the `Renderer` component from `@docvia/renderer-svelte`
and the `registry` from `$lib/registry`. See
[`examples/demo-svelte`](./examples/demo-svelte) and [`apps/web`](./apps/web)
for working setups.

### Next.js

```bash
pnpm add -D @docvia/plugin-next
pnpm add @docvia/renderer-react @docvia/source react react-dom
```

```ts
// next.config.ts
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia()({
  reactStrictMode: true,
});
```

`withDocvia()` rewrites `defineDocs()` / `defineRegistry()` in files named
`source.{ts,tsx,js,mjs}` and `registry.{ts,tsx,js}`, for **both webpack and
Turbopack**. Other names: `withDocvia({ macroFiles: ["docs-source.ts"] })`.

```tsx
// app/docs/[[...slug]]/page.tsx
import { DocviaContent } from "@docvia/renderer-react";
import { notFound } from "next/navigation";
import { registry } from "@/lib/registry";
import { source } from "@/lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  const { content } = await page.data.load();
  return <DocviaContent nodes={content} registry={registry} />;
}
```

See [`examples/demo-next`](./examples/demo-next).

### Search

`createFromSource()` indexes a `loader()` source from the `structuredData` each
page emits at compile time, with no filesystem access:

```ts
// app/api/search/route.ts
import { createFromSource, createSearchHandler } from "@docvia/search";
import { source } from "@/lib/source";

const handler = createFromSource(source).then(createSearchHandler);

export async function GET(request: Request) {
  return (await handler)(request);
}
```

### Server-side rendering

Framework apps render through `page.data.load()` on the server, Node or edge.
For a **non-framework Node server** that renders per request, `@docvia/ssr`
renders IR resolved by a content source. A live `CompileService` already is
one, so pass it directly:

```ts
import { createDocviaSSR } from "@docvia/ssr";

const ssr = createDocviaSSR({ provider: service }); // or a (collection, slug) => IR fn
const page = await ssr.render("docs", "getting-started");
```

Rendered pages are cached in an in-memory LRU keyed by content hash.

### Legacy config collections

`collections` / `sourceDir` / `outDir` in `docvia.config.ts` and the
`virtual:docvia/source` / `docvia/source` imports still work, but `defineDocs()`
is the recommended path. The standalone CLI (`docvia build`, `dev`, `sync`,
`preview`) targets that legacy setup.

## Packages

| Package | Version | Purpose |
|---|---|---|
| [`@docvia/cli`](https://www.npmjs.com/package/@docvia/cli) | [![npm](https://img.shields.io/npm/v/@docvia/cli.svg)](https://www.npmjs.com/package/@docvia/cli) | `init` scaffolding plus the standalone `build` / `dev` / `sync` / `preview` commands (dev dependency only). |
| [`@docvia/runtime`](https://www.npmjs.com/package/@docvia/runtime) | [![npm](https://img.shields.io/npm/v/@docvia/runtime.svg)](https://www.npmjs.com/package/@docvia/runtime) | Page pipeline, macro transform, and `CompileService`, shared by every integration. |
| [`@docvia/compiler`](https://www.npmjs.com/package/@docvia/compiler) | [![npm](https://img.shields.io/npm/v/@docvia/compiler.svg)](https://www.npmjs.com/package/@docvia/compiler) | Batch build entry (`compile()`), a thin wrapper over `CompileService`. |
| [`@docvia/core`](https://www.npmjs.com/package/@docvia/core) | [![npm](https://img.shields.io/npm/v/@docvia/core.svg)](https://www.npmjs.com/package/@docvia/core) | Markdown parsing pipeline (`unified` + `remark` + `rehype`). |
| [`@docvia/ir`](https://www.npmjs.com/package/@docvia/ir) | [![npm](https://img.shields.io/npm/v/@docvia/ir.svg)](https://www.npmjs.com/package/@docvia/ir) | Intermediate representation, error system, AST → IR transform. |
| [`@docvia/schema`](https://www.npmjs.com/package/@docvia/schema) | [![npm](https://img.shields.io/npm/v/@docvia/schema.svg)](https://www.npmjs.com/package/@docvia/schema) | Frontmatter validation (Standard Schema), YAML extraction, TS codegen. |
| [`@docvia/plugins`](https://www.npmjs.com/package/@docvia/plugins) | [![npm](https://img.shields.io/npm/v/@docvia/plugins.svg)](https://www.npmjs.com/package/@docvia/plugins) | `defineConfig`, `loadConfig`, `PluginRunner`. |
| [`@docvia/ssr`](https://www.npmjs.com/package/@docvia/ssr) | [![npm](https://img.shields.io/npm/v/@docvia/ssr.svg)](https://www.npmjs.com/package/@docvia/ssr) | Request-time rendering for non-framework Node servers. |
| [`@docvia/renderer-core`](https://www.npmjs.com/package/@docvia/renderer-core) | [![npm](https://img.shields.io/npm/v/@docvia/renderer-core.svg)](https://www.npmjs.com/package/@docvia/renderer-core) | Framework-agnostic rendering engine and default renderers. |
| [`@docvia/renderer-react`](https://www.npmjs.com/package/@docvia/renderer-react) | [![npm](https://img.shields.io/npm/v/@docvia/renderer-react.svg)](https://www.npmjs.com/package/@docvia/renderer-react) | React renderer adapter (server + `./client` hydration). |
| [`@docvia/renderer-svelte`](https://www.npmjs.com/package/@docvia/renderer-svelte) | [![npm](https://img.shields.io/npm/v/@docvia/renderer-svelte.svg)](https://www.npmjs.com/package/@docvia/renderer-svelte) | Svelte renderer adapter. |
| [`@docvia/search`](https://www.npmjs.com/package/@docvia/search) | [![npm](https://img.shields.io/npm/v/@docvia/search.svg)](https://www.npmjs.com/package/@docvia/search) | Section-level Orama search: `createFromSource()` for a `loader()` source, plus a client helper. |
| [`@docvia/source`](https://www.npmjs.com/package/@docvia/source) | [![npm](https://img.shields.io/npm/v/@docvia/source.svg)](https://www.npmjs.com/package/@docvia/source) | `loader()` plus the `defineDocs()` / `defineRegistry()` macros (`@docvia/source/macro`). |
| [`@docvia/plugin-vite`](https://www.npmjs.com/package/@docvia/plugin-vite) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-vite.svg)](https://www.npmjs.com/package/@docvia/plugin-vite) | In-process Vite plugin (`docvia()`): compiles `defineDocs()` collections, with HMR. |
| [`@docvia/plugin-next`](https://www.npmjs.com/package/@docvia/plugin-next) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-next.svg)](https://www.npmjs.com/package/@docvia/plugin-next) | Next.js wrapper (`withDocvia`) for webpack and Turbopack. |
| [`@docvia/plugin-shiki`](https://www.npmjs.com/package/@docvia/plugin-shiki) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-shiki.svg)](https://www.npmjs.com/package/@docvia/plugin-shiki) | Build-time syntax highlighting via Shiki (pluggable). |
| [`@docvia/plugin-openapi`](https://www.npmjs.com/package/@docvia/plugin-openapi) | [![npm](https://img.shields.io/npm/v/@docvia/plugin-openapi.svg)](https://www.npmjs.com/package/@docvia/plugin-openapi) | Generate reference pages from an OpenAPI spec. |

## Status

v0.2 preview. APIs are stabilizing; expect breaking changes before v1.0. See
[`.changeset/`](./.changeset) for in-flight release notes and
[documentation.md](./documentation.md) for architecture notes.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the local
setup, watch modes, and release workflow.

## License

The published `@docvia/*` packages (`packages/*`) are MIT licensed; each ships
its own `LICENSE`. The rest of the repository, including `apps/` and
`examples/`, is GPL-3.0 (see [LICENSE](./LICENSE)).
