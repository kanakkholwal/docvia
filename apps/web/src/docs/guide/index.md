---
title: "Guides"
description: "Task-oriented guides for configuring docvia, integrating it with a framework, and extending the pipeline."
eyebrow: "Guide"
order: 2
---

The guides cover docvia from the user's side: how to configure it, wire it
into an app, and extend it. For the API surface of an individual package, see
the [Packages](/docs/packages) reference.

## In this section

- [Configuration](/docs/guide/configuration) lists every option accepted by
  `defineConfig`, with defaults and types.
- [Framework integration](/docs/guide/frameworks) covers SvelteKit, Next.js,
  React with Vite, and TanStack Start.
- [CLI reference](/docs/guide/cli) documents every `docvia` command and flag.
- [Writing plugins](/docs/guide/plugins) explains the five pipeline hook points
  and how to author a plugin.
- [Architecture](/docs/guide/architecture) describes the compile pipeline, the
  IR, and what `defineDocs()` compiles to.
- [Incremental builds](/docs/guide/incremental-builds) covers how content
  hashing decides what to recompile.

## The mental model

docvia has two halves:

```mermaid
%% title: The two halves
flowchart LR
  subgraph core ["1. Compile core"]
    MD["Markdown"] --> CS["PagePipeline"] --> MG["Lazy page modules"]
  end
  subgraph app ["2. Framework integration"]
    MG --> SRC["getPage · getPages · pageTree"] --> REN["Renderer"] --> PAGE["Framework-native page"]
  end
```

1. **The compile core** (`PagePipeline`) reads Markdown, runs it through the
   pipeline, and produces a compiled module per page, at build time, in the
   dev server, or per request.
2. **A framework integration** consumes those modules. A `defineDocs()`
   collection wrapped in `loader()` gives you `getPage`, `getPages`, and
   `pageTree`, and a renderer turns each page's content into framework-native
   output.

The same core runs in three modes, build, dev, and SSR, so their output is
identical. Plugins, the frontmatter schema, content hashing, and syntax
highlighting are all details of how the core produces those modules. See
[Architecture](/docs/guide/architecture) for the full picture.
