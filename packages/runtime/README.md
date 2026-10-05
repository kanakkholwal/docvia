# @docvia/runtime

The page pipeline shared by every docvia integration.

- `PagePipeline` reads frontmatter and compiles page bodies, cached in memory
  by content hash. Nothing is written to disk.
- `transformMacroModule()` rewrites `defineDocs()` / `defineRegistry()` calls
  from `@docvia/source/macro` into a frontmatter index plus lazy per-page
  imports. `@docvia/plugin-vite` and `@docvia/plugin-next` drive it.
- `CompileService` holds the resolved config and compiled pages for a process.
  It backs `@docvia/compiler`'s `compile()` and `@docvia/ssr`: a live
  `CompileService` is a valid `ContentSource` for `createDocviaSSR`.

Not a public-facing API surface; use a framework plugin instead.
