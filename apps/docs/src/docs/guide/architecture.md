---
title: "Architecture"
description: "The compile pipeline, the Intermediate Representation, and the generated module graph."
eyebrow: "Guide"
order: 5
---

docvia is a small set of packages arranged around one idea: parse Markdown
once, at build time, into a framework-agnostic Intermediate Representation
(IR), then let a renderer turn that IR into framework-native modules.

## The compile pipeline

[`@docvia/compiler`](/packages/compiler) walks `sourceDir`, and runs every
`.md` file through this sequence:

1. **`beforeParse`** — plugins rewrite the raw file.
2. **Frontmatter** — [`@docvia/schema`](/packages/schema) splits the YAML
   block and validates it.
3. **Parse** — [`@docvia/core`](/packages/core) turns the Markdown body into a
   sanitized HAST tree (`unified` + `remark` + `rehype`).
4. **`afterParse`** / **`beforeTransform`** — plugins manipulate the AST.
5. **Transform** — [`@docvia/ir`](/packages/ir)'s `transformToIR` converts the
   HAST tree into an `IRDocument`.
6. **`afterTransform`** / **`beforeRender`** — plugins manipulate the IR.
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

`@docvia/ir` is deliberately dependency-light (only `github-slugger`), so every
other package can import its types without pulling in a heavy tree.

## The generated module graph

A successful build writes a five-file module graph into `outDir` (default
`.docvia/`):

| File | Purpose |
|---|---|
| `source.ts` | The typed collection helpers — `getPage`, `getPages`, `pageTree`, `generateParams`. |
| `dynamic.ts` | Lazy and eager loaders for each compiled page module. |
| `registry.ts` | The component registry for `:::component` directives. |
| `types.d.ts` | Generated frontmatter and route-key types per collection. |
| `.docvia.cache.json` | The incremental build cache. |

A project-root `docvia-env.d.ts` is also emitted so the `docvia/source` import
specifier type-checks.

Your app never imports the compiler or a Markdown parser — it imports
`docvia/source`, which is plain generated TypeScript backed by these files.

## The package map

| Layer | Packages |
|---|---|
| Contracts | [`@docvia/ir`](/packages/ir) |
| Parsing | [`@docvia/core`](/packages/core), [`@docvia/schema`](/packages/schema) |
| Orchestration | [`@docvia/compiler`](/packages/compiler), [`@docvia/plugins`](/packages/plugins) |
| Rendering | [`@docvia/renderer-core`](/packages/renderer-core), [`@docvia/renderer-react`](/packages/renderer-react), [`@docvia/renderer-svelte`](/packages/renderer-svelte) |
| Runtime | [`@docvia/source`](/packages/source), [`@docvia/search`](/packages/search) |
| Integration | [`@docvia/cli`](/packages/cli), [`@docvia/plugin-vite`](/packages/plugin-vite), [`@docvia/plugin-next`](/packages/plugin-next), [`@docvia/plugin-openapi`](/packages/plugin-openapi) |

The [Packages](/packages) section documents each one in depth.
