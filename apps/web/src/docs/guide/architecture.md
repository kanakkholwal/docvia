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
| **Build** | [`@docvia/compiler`](/packages/compiler) | Compiles the whole tree once and emits the on-disk module graph (thin glue that imports the Markdown in place). |
| **Dev** | [`@docvia/plugin-vite`](/packages/plugin-vite), [`@docvia/plugin-next`](/packages/plugin-next) | Runs the service in-process inside the bundler and recompiles incrementally on every file change. |
| **SSR** | [`@docvia/ssr`](/packages/ssr) | Renders a single document per request, on Node or the edge. |

`compile()` — the classic batch entry point — is now a thin wrapper over
`CompileService`. The key methods are `compileAll()`, `compileFile()`,
`invalidate(filePaths)` for incremental recompilation, `getDocument()`, and the
module-graph emitters.

## The three run modes

### Build

`docvia build` (or `compile()`) walks `sourceDir` once, compiles every file,
and emits the on-disk module graph — thin glue that imports the Markdown in
place. This is the ahead-of-time path — see
[the module graph](#the-generated-module-graph) below.

### Dev

The bundler plugins run `CompileService` **in-process** — there is no separate
`docvia build` step. The service watches `sourceDir` and recompiles
incrementally through `invalidate()`: a content-only change hot-swaps the
affected module, a route-map change triggers a reload. Under Vite,
`virtual:docvia/source` is served as an in-memory **virtual module**, so nothing
is written to disk during development.

### SSR

Because `source.ts` uses **static** `?docvia` imports, a framework app — Vite or
Next.js, including on the edge — already renders pages at request time by calling
`docs.getPage(...)`; the content is bundled in. No extra package is required.

For a **non-framework Node server**, [`@docvia/ssr`](/packages/ssr) renders one
document per request. `createDocviaSSR({ provider })` resolves IR through a
generic `ContentSource` — a `ContentProvider`, a live `CompileService` (which
already satisfies the shape), or a `(collection, slug) => IR` function — renders
it with the shared pipeline, and caches rendered pages in an in-memory LRU keyed
by content hash. The package itself never touches the filesystem, so it is
edge-safe regardless of source.

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

No page content is emitted — the content stays in the `.md`, compiled in place
by the bundler's `?docvia` transform. The graph is just thin glue:

| File | Purpose |
|---|---|
| `source.ts` | The typed collection helpers — `getPage`, `getPages`, `pageTree`, `generateParams`. **Eager** `?docvia` imports, for server/SSR. |
| `browser.ts` | The **lazy**, client counterpart — `() => import()` per page, so each page code-splits into its own chunk. |
| `dynamic.ts` | The page module map the collections read from. |
| `registry.ts` | The component registry for `:::component` directives (only when components are configured). |
| `types.d.ts` | Generated frontmatter and route-key types per collection. |
| `.docvia.cache.json` | The incremental build cache. |

A project-root `docvia-env.d.ts` is also emitted so the source import specifier
type-checks (`virtual:docvia/source` on Vite, `docvia/source` on Next.js, each
with a `/browser` counterpart).

Your app never imports the compiler or a Markdown parser — it imports the source
module, which is plain generated TypeScript (under Vite, a virtual module served
by the plugin) backed by these files.

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
