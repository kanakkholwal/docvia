---
title: "What is docvia?"
description: "A build-time documentation compiler for React, Svelte, or any framework with a renderer adapter."
eyebrow: "Introduction"
order: 0
---

**docvia** turns a directory of Markdown into typed, pre-rendered modules.
There is no runtime Markdown parser shipped to the browser — every page is
parsed, sanitized, and transformed into an intermediate representation at build
time.

This documentation site is itself compiled by docvia. Every page you are
reading is a Markdown file under `apps/docs/src/docs/`, run through the
`@docvia/compiler` and rendered by `@docvia/renderer-svelte`.

## Why a compiler?

Most documentation toolchains ship the Markdown parser to the browser, or walk
it on every server request. docvia treats your docs the way a modern bundler
treats your source code: hash content, cache aggressively, and emit a tiny
module graph the bundler can tree-shake.

The result is a clean separation:

- **Build time** — Markdown is parsed, validated, transformed to an
  Intermediate Representation (IR), and rendered to framework-native modules.
- **Runtime** — your app imports plain modules. No parser, no `unified`, no
  `remark` in the client bundle.

## Highlights

- **Build-time first.** Zero runtime Markdown parser.
- **Incremental cache.** A `.docvia.cache.json` is persisted between runs;
  second builds for unchanged content take milliseconds.
- **Typed end-to-end.** Frontmatter, route keys, and the generated `source`
  helper are all typed.
- **Pluggable pipeline.** Five hook points let you mutate the pipeline at any
  stage — `beforeParse`, `afterParse`, `beforeTransform`, `afterTransform`,
  `beforeRender`.
- **Framework adapters.** First-party React and Svelte renderers, a Vite
  plugin, and a Next.js wrapper for direct integration.

## How it fits together

```bash
docvia build          # Markdown ──▶ .docvia/ module graph
```

```ts
import { docs } from "docvia/source"; // generated into .docvia/

const page = await docs.getPage(["getting-started"]);
const tree = docs.pageTree; // navigation tree
```

A framework integration (Vite plugin or Next.js wrapper) runs `docvia build`
for you and resolves `docvia/source` to the compiled output, so your app only
ever imports typed modules.

## Next steps

- [Getting started](/getting-started) — install the CLI and compile your first
  build.
- [Configuration](/guide/configuration) — every option accepted by
  `defineConfig`.
- [Framework integration](/guide/frameworks) — wire docvia into SvelteKit,
  Next.js, or a plain Vite app.
- [Packages](/packages) — the full reference for every `@docvia/*` package.
