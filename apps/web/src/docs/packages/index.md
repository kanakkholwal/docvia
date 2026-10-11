---
title: "Packages"
description: "Deep reference for every @docvia/* package: what each one does, where it runs, and every export."
eyebrow: "Packages"
order: 3
---

docvia ships as eight packages. Two hold almost everything, split by where the code runs; the rest are
the command line, search and the plugins with heavy dependencies. This section is the API reference for
each one. For task-oriented walkthroughs, see the [Guides](/docs/guide).

| Package | Runs | What it is |
|---|---|---|
| [`@docvia/core`](/docs/packages/core) | Anywhere: Workers, browsers, Node | Config and plugin API, the IR, Markdown parsing, rendering, sources, SSR, and the React and Svelte bindings. No Node APIs. |
| [`@docvia/build`](/docs/packages/build) | Node, at build time | The compiler, the page pipeline, config file loading, and the Vite and Next.js plugins. |
| [`@docvia/cli`](/docs/packages/cli) | Node | The `docvia` command (`init`, `build`, `dev`, `sync`, `preview`). |
| [`@docvia/search`](/docs/packages/search) | Anywhere | Section-level Orama indexing and the client search helper. |
| [`@docvia/markdown`](/docs/packages/markdown) | Anywhere, any app | A dependency-free Markdown renderer with streaming for AI output. Needs nothing else from docvia. |
| [`@docvia/plugin-shiki`](/docs/packages/plugin-shiki) | Build time | Syntax highlighting via Shiki. |
| [`@docvia/plugin-mermaid`](/docs/packages/plugin-mermaid) | Build time | Mermaid fences as diagram components. |
| [`@docvia/plugin-openapi`](/docs/packages/plugin-openapi) | Build time, plus a Workers-safe proxy | API reference pages from an OpenAPI spec. |

An app usually installs two of them:

```bash
pnpm add @docvia/core @docvia/search
pnpm add -D @docvia/build @docvia/plugin-shiki
```

## @docvia/core

Each area is a subpath, so an app only bundles what it imports.

- [Types and IR](/docs/packages/core/ir) and the [plugin API](/docs/packages/core/plugins): `@docvia/core`
- [Markdown](/docs/packages/core/markdown): `@docvia/core/markdown`
- [Frontmatter schema](/docs/packages/core/schema): `@docvia/core/schema`
- [Rendering](/docs/packages/core/render): `@docvia/core/render`
- [Sources](/docs/packages/core/source): `@docvia/core/source`
- [SSR](/docs/packages/core/ssr): `@docvia/core/ssr`
- [React](/docs/packages/core/react) and [Svelte](/docs/packages/core/svelte): `@docvia/core/react`, `@docvia/core/svelte`

## @docvia/build

- [Pipeline and compile service](/docs/packages/build/pipeline): `@docvia/build`
- [`compile()`](/docs/packages/build/compiler): `@docvia/build`
- [Vite plugin](/docs/packages/build/vite): `@docvia/build/vite`
- [Next.js plugin](/docs/packages/build/next): `@docvia/build/next`
