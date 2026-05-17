# docvia modes

docvia compiles markdown into a renderable IR and ships it through one of three
modes. All three sit on the same long-lived `CompileService` (`@docvia/runtime`),
so build, dev, and SSR share one render path — output is identical regardless of
mode.

| Mode  | When it runs            | Where compilation happens                  |
| ----- | ----------------------- | ------------------------------------------- |
| Build | Ahead of time           | Once, emits an on-disk module graph + IR chunks |
| Dev   | While the dev server runs | In-process, incremental on every file change |
| SSR   | Per request             | Render-only, from pre-built IR chunks        |

## Build mode

`CompileService.compileAll()` + `emitDiskModuleGraph()` parse every markdown
file, run the plugin pipeline, and emit:

- the on-disk module graph (`.docvia/*.ts`) consumed via the `docvia/source` alias,
- per-route IR chunks (`.docvia/ir/<collection>/<slug>.json`) + `ir/manifest.json`.

The IR chunks are fully pre-processed — including build-time syntax
highlighting — so neither SSR nor the client ships a highlighter.

`@docvia/compiler`'s `compile()` is a thin wrapper over this path.

## Dev mode

The bundler plugin runs `CompileService` in-process — no separate `docvia build`
step. The compiler watches the source dir and recompiles incrementally via
`service.invalidate(filePaths)`; a content-only change hot-swaps the affected
`.md?docvia` module, a route-map change triggers a reload. Errors surface in the
dev-server error overlay.

In dev, `docvia/source` is served as an in-memory **virtual module** (Vite) — no
`.docvia/*.ts` files are written, except `types.d.ts` for the editor.

## SSR mode

Request-time rendering via `@docvia/ssr`. `createDocviaSSR()` resolves an IR
document through a `ContentProvider`, renders it with `@docvia/renderer-core`,
and caches rendered pages in an in-memory LRU keyed by `contentHash`.

Two content providers:

- **`FsContentProvider`** (`@docvia/ssr/node`) — reads IR chunks from disk via a
  `CompileService`. Node only.
- **`BundledContentProvider`** (`@docvia/ssr`) — serves IR chunks through a
  caller-supplied `ChunkLoader`. No `node:fs`, edge-safe (Cloudflare Workers).
  `createGlobChunkLoader(import.meta.glob("/.docvia/ir/**/*.json"))` turns the
  build's IR chunks into a loader the bundler can statically code-split.

## Which plugin per framework

| Framework             | Plugin / entry            | Notes                                              |
| --------------------- | ------------------------- | -------------------------------------------------- |
| Vite + SvelteKit      | `docvia()` (`@docvia/plugin-vite`) | In-process compile, virtual `docvia/source`, HMR. |
| Next.js (webpack)     | `withDocvia` (`@docvia/plugin-next`) | Drives `CompileService`; disk module graph + webpack alias. |
| Next.js (Turbopack)   | `withDocvia` (`@docvia/plugin-next`) | Same wrapper; adds `turbopack.resolveAlias`. Disk graph (no plugin API). |
| Generic / no bundler  | `docvia dev` / `docvia build` (`@docvia/cli`) | Long-lived `CompileService` with incremental `invalidate()`. |
