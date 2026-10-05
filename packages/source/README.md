# @docvia/source

`loader()` and the `defineDocs()` / `defineRegistry()` macros for docvia

Part of [docvia](https://github.com/kanakkholwal/docvia), a Markdown
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

```bash
pnpm add @docvia/source
```

## Usage

```ts
// lib/source.ts
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
const page = source.getPage(["getting-started"]); // sync, frontmatter only
if (!page) notFound();
const { content, toc, headings, manifest, structuredData } = await page.data.load();

source.getPages();
source.pageTree; // or source.getPageTree()
source.generateParams();
source.getPageByHref("/docs/guide#setup");
```

`defineRegistry()` returns the component registry built from `components` in
`docvia.config.ts`. Both macros need the bundler plugin (`@docvia/plugin-vite`
or `@docvia/plugin-next`); called without it they throw.

A `meta.json` per folder sets `title`, `pages` (names, `...`, `---Separator---`,
`!exclude`, `[Text](url)`), `defaultOpen`, and `root`. `RenderOutput`,
`ComponentRegistry`, and `HydrationManifest` are re-exported from here.

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
