---
title: "@docvia/build"
description: "docvia's build tooling for Node: the compiler, the page pipeline, config loading, and the Vite and Next.js plugins."
eyebrow: "Packages"
order: 20
---

`@docvia/build` is the half of docvia that runs on your machine or in CI: it scans your content, loads
`docvia.config.ts`, compiles pages and plugs into Vite or Next.js. It needs Node, and nothing in it ships
to the browser or a Worker; what does ship comes from [`@docvia/core`](/docs/packages/core).

## Install

```bash
pnpm add -D @docvia/build
```

`@docvia/core` is a peer dependency, because the code the plugins generate imports it from your app.
Vite and Next.js are optional peers: install the one you use.

## Subpaths

| Import | Contents |
|---|---|
| `@docvia/build` | The [pipeline and compile service](/docs/packages/build/pipeline), [`compile()`](/docs/packages/build/compiler), and config loading: `loadConfig`, `resolveProject`, `resolveConfigPath`. |
| `@docvia/build/vite` | The [`docvia()` Vite plugin](/docs/packages/build/vite) and `defineConfig`. |
| `@docvia/build/next` | The [`withDocvia()` Next.js wrapper](/docs/packages/build/next) and its loaders. |
