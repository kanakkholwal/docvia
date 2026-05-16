# @docvia/runtime

The stateful compile service that backs every docvia mode.

`CompileService` holds the resolved config, plugin runner, incremental cache, and
in-memory module graph for the lifetime of a process. Every docvia mode drives
this one service, so build, dev, and request-time output stay identical:

- `@docvia/compiler`'s `compile()` — batch build (a thin wrapper over it).
- `@docvia/plugin-vite` / `@docvia/plugin-next` — in-process dev compilation
  with incremental `invalidate()`.
- `@docvia/ssr` (via `@docvia/ssr/node`) — request-time rendering.

Key surface: `compileAll()`, `compileFile()`, `getDocument()`,
`invalidate(filePaths)`, `emitDiskModuleGraph()`, and the virtual-source /
type-declaration emitters.

Not a public-facing API surface; consume `@docvia/compiler` or a framework
plugin instead.
