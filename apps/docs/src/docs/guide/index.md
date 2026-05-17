---
title: "Guides"
description: "Task-oriented guides for configuring docvia, integrating it with a framework, and extending the pipeline."
eyebrow: "Guide"
order: 2
---

The guides cover docvia from the user's side — how to configure it, wire it
into an app, and extend it. For the API surface of an individual package, see
the [Packages](/packages) reference.

## In this section

- [Configuration](/guide/configuration) — every option accepted by
  `defineConfig`, with defaults and types.
- [Framework integration](/guide/frameworks) — SvelteKit, Next.js, and plain
  Vite setups.
- [CLI reference](/guide/cli) — every `docvia` command and flag.
- [Writing plugins](/guide/plugins) — the five pipeline hook points and how to
  author a plugin.
- [Architecture](/guide/architecture) — the compile pipeline, the IR, and the
  generated module graph.
- [Incremental builds](/guide/incremental-builds) — how the content-hash cache
  decides what to rebuild.

## The mental model

docvia has two halves:

1. **The compile core** (`CompileService`) reads Markdown, runs it through the
   pipeline, and produces a typed module graph — at build time, in the dev
   server, or per request.
2. **A framework integration** consumes that module graph — `docvia/source`
   gives you `getPage`, `getPages`, and `pageTree`, and a renderer turns each
   page's content into framework-native output.

The same core runs in three modes — build, dev, and SSR — so their output is
identical. Everything else — plugins, the frontmatter schema, the incremental
cache, syntax highlighting — is a detail of how the core produces that module
graph. See [Architecture](/guide/architecture) for the full picture.
