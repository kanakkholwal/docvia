---
title: "Architecture"
description: "The compile core, the three run modes, the Intermediate Representation, and the generated module graph."
eyebrow: "Guide"
order: 5
---

docvia is a small set of packages arranged around one idea: parse Markdown
into a framework-agnostic Intermediate Representation (IR), then let a renderer
turn that IR into framework-native output. The same compile core does this at
build time, inside a dev server, and per request — so output is identical
across all three.

## The compile core

At the centre is [`@docvia/runtime`](/packages/runtime)'s **`CompileService`** —
a stateful, long-lived object that holds the resolved config, the plugin
runner, the incremental cache, and the in-memory module graph for the lifetime
of a process.

Every docvia mode drives this one service, which is why their output never
drifts:

| Mode | Driven by | What it does |
|---|---|---|
| **Build** | [`@docvia/compiler`](/packages/compiler) | Compiles the whole tree once and emits the on-disk module graph plus per-route IR chunks. |
| **Dev** | [`@docvia/plugin-vite`](/packages/plugin-vite), [`@docvia/plugin-next`](/packages/plugin-next) | Runs the service in-process inside the bundler and recompiles incrementally on every file change. |
| **SSR** | [`@docvia/ssr`](/packages/ssr) | Renders a single document per request, on Node or the edge. |

`compile()` — the classic batch entry point — is now a thin wrapper over
`CompileService`. The key methods are `compileAll()`, `compileFile()`,
`invalidate(filePaths)` for incremental recompilation, `getDocument()`, and the
module-graph / IR-chunk emitters.

## The three run modes

### Build

`docvia build` (or `compile()`) walks `sourceDir` once, compiles every file,
and emits the on-disk module graph plus per-route IR chunks. This is the
ahead-of-time path — see [the module graph](#the-generated-module-graph) below.

### Dev

The bundler plugins run `CompileService` **in-process** — there is no separate
`docvia build` step. The service watches `sourceDir` and recompiles
incrementally through `invalidate()`: a content-only change hot-swaps the
affected module, a route-map change triggers a reload. Under Vite,
`docvia/source` is served as an in-memory **virtual module**, so nothing is
written to disk during development.

### SSR

[`@docvia/ssr`](/packages/ssr) renders one document per request.
`createDocviaSSR()` resolves IR through a `ContentProvider`, renders it with
the shared rendering pipeline, and caches rendered pages in an in-memory LRU
keyed by content hash:

- **`FsContentProvider`** (`@docvia/ssr/node`) — wraps a live `CompileService`;
  Node only.
- **`BundledContentProvider`** (`@docvia/ssr`) — serves pre-built per-route IR
  chunks via a loader. No `node:fs`, no Markdown parsing at request time —
  safe to bundle for Cloudflare Workers and other edge runtimes.

## The compile pipeline

Whichever mode is active, each `.md` file runs through this sequence:

1. **`beforeParse`** — plugins rewrite the raw file.
2. **Frontmatter** — [`@docvia/schema`](/packages/schema) splits the YAML
   block and validates it.
3. **Parse** — [`@docvia/core`](/packages/core) turns the Markdown body into a
   sanitized HAST tree (`unified` + `remark` + `rehype`).
4. **`afterParse`** / **`beforeTransform`** — plugins manipulate the AST.
5. **Transform** — [`@docvia/ir`](/packages/ir)'s `transformToIR` converts the
   HAST tree into an `IRDocument`.
6. **`afterTransform`** / **`beforeRender`** — plugins manipulate the IR. This
   is where [`@docvia/plugin-shiki`](/packages/plugin-shiki) highlights code
   blocks and bakes the HTML into the IR.
7. **Render** — the configured `RendererAdapter` turns the `IRDocument` into a
   framework-native module.

Plugin hooks are interleaved at five fixed points — see
[Writing plugins](/guide/plugins).

## The Intermediate Representation

The IR is the contract that decouples Markdown from any framework. An
`IRDocument` is a normalized tree of `IRNode`s with HTML-native prop names —
no `className`, no style objects, no framework-specific attributes.

Because the IR is framework-agnostic, the same compiled document can be
rendered by the React adapter, the Svelte adapter, or any custom
`RendererAdapter` you write. The IR is also where docvia enforces safety:
`transformToIR` drops blocked tags such as `script` and `iframe`.

Syntax highlighting is a **build-time IR transform**, not a render-time step.
A highlighter plugin populates `props.html` on `code-block` nodes during
`beforeRender`, so the IR ships pre-highlighted — and **no syntax highlighter
ships to the browser or the edge bundle**. Highlighting is pluggable: Shiki is
the default (`@docvia/plugin-shiki`), but any highlighter can be wired the
same way.

`@docvia/ir` is deliberately dependency-light (only `github-slugger`), so every
other package can import its types without pulling in a heavy tree.

## The generated module graph

A build writes a typed module graph into `outDir` (default `.docvia/`):

| File | Purpose |
|---|---|
| `source.ts` | The typed collection helpers — `getPage`, `getPages`, `pageTree`, `generateParams`. |
| `dynamic.ts` | Lazy and eager loaders for each compiled page module. |
| `registry.ts` | The component registry for `:::component` directives. |
| `types.d.ts` | Generated frontmatter and route-key types per collection. |
| `ir/<collection>/<slug>.json` | Per-route IR chunks — pre-built, all plugins applied. Consumed by SSR and by bundlers without a `?docvia` transform. |
| `ir/manifest.json` | The index of emitted IR chunks. |
| `.docvia.cache.json` | The incremental build cache. |

A project-root `docvia-env.d.ts` is also emitted so the `docvia/source` import
specifier type-checks.

Your app never imports the compiler or a Markdown parser — it imports
`docvia/source`, which is plain generated TypeScript (in dev, a virtual module
served by the bundler plugin) backed by these files.

## The package map

| Layer | Packages |
|---|---|
| Contracts | [`@docvia/ir`](/packages/ir) |
| Parsing | [`@docvia/core`](/packages/core), [`@docvia/schema`](/packages/schema) |
| Compile core | [`@docvia/runtime`](/packages/runtime), [`@docvia/compiler`](/packages/compiler), [`@docvia/plugins`](/packages/plugins) |
| Rendering | [`@docvia/renderer-core`](/packages/renderer-core), [`@docvia/renderer-react`](/packages/renderer-react), [`@docvia/renderer-svelte`](/packages/renderer-svelte) |
| Runtime | [`@docvia/source`](/packages/source), [`@docvia/ssr`](/packages/ssr), [`@docvia/search`](/packages/search) |
| Integration | [`@docvia/cli`](/packages/cli), [`@docvia/plugin-vite`](/packages/plugin-vite), [`@docvia/plugin-next`](/packages/plugin-next), [`@docvia/plugin-shiki`](/packages/plugin-shiki), [`@docvia/plugin-openapi`](/packages/plugin-openapi) |

The [Packages](/packages) section documents each one in depth.
