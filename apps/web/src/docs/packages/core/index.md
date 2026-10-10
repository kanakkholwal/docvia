---
title: "@docvia/core"
description: "Everything that runs where your docs are served: config and plugin API, IR, Markdown, rendering, sources, SSR, and the React and Svelte bindings."
eyebrow: "Packages"
order: 10
---

`@docvia/core` is the part of docvia that runs where your docs are served, in a Cloudflare Worker, a
browser or Node. It uses no Node APIs, and a test fails the build if one appears. Build tooling that does
need Node (scanning files, loading `docvia.config.ts`, the Vite and Next.js plugins) is in
[`@docvia/build`](/docs/packages/build).

## Install

```bash
pnpm add @docvia/core
```

React and Svelte are optional peer dependencies: install the one your app uses.

## Subpaths

| Import | Contents |
|---|---|
| `@docvia/core` | [IR and config types](/docs/packages/core/ir), `docviaError`, the [plugin API](/docs/packages/core/plugins) (`defineConfig`, `PluginRunner`). |
| `@docvia/core/markdown` | [`parseMarkdown`](/docs/packages/core/markdown) and `markdownToIR`, the pipeline every mode shares. |
| `@docvia/core/schema` | [Frontmatter](/docs/packages/core/schema) extraction and validation. |
| `@docvia/core/render` | The [rendering engine](/docs/packages/core/render); `/render/client` installs copy buttons and code tabs. |
| `@docvia/core/source` | [`loader()`](/docs/packages/core/source), the page tree; `/source/macro` has `defineDocs()`. |
| `@docvia/core/ssr` | [Request-time rendering](/docs/packages/core/ssr). |
| `@docvia/core/react` | The [React bindings](/docs/packages/core/react); `/react/client` hydrates islands. |
| `@docvia/core/svelte` | The [Svelte bindings](/docs/packages/core/svelte); `/svelte/node` is the build-time renderer. |
