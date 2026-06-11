# docvia modes

docvia compiles markdown into a renderable IR and ships it through one of three
modes. All three sit on the same long-lived `CompileService` (`@docvia/runtime`),
so build, dev, and SSR share one render path — output is identical regardless of
mode.

| Mode  | When it runs            | Where compilation happens                  |
| ----- | ----------------------- | ------------------------------------------- |
| Build | Ahead of time           | Once, emits the on-disk glue; the bundler compiles each `.md?docvia` in place |
| Dev   | While the dev server runs | In-process, incremental on every file change |
| SSR   | Per request             | Render-only, via the in-place module                |

## Build mode

`CompileService.compileAll()` + `emitDiskModuleGraph()` write the thin on-disk
glue — `source.ts` + `dynamic.ts` (plus `registry.ts` / `types.d.ts`) — that
**statically imports each markdown module** as `./x.md?docvia`. The host
bundler's `?docvia` loader (Vite, webpack, Turbopack) transforms each one
through the plugin pipeline and configured renderer, in place. No per-route IR
JSON is emitted; content lives once in the `.md`, and the bundler code-splits,
tree-shakes, and (for SSR/edge) bundles it directly.

Build-time syntax highlighting is baked into the module by the loader, so
neither SSR nor the client ships a highlighter.

`@docvia/compiler`'s `compile()` is a thin wrapper over this path.

## Dev mode

The bundler plugin runs `CompileService` in-process — no separate `docvia build`
step. The compiler watches the source dir and recompiles incrementally via
`service.invalidate(filePaths)`; a content-only change hot-swaps the affected
`.md?docvia` module, a route-map change triggers a reload. Errors surface in the
dev-server error overlay.

In Vite, `virtual:docvia/source` is served as an in-memory **virtual module**
([Vite convention](https://vite.dev/guide/api-plugin#importing-a-virtual-file)) —
in dev *and* build, so no `source.ts` wrapper is bundled. Next.js instead aliases
the bare `docvia/source` specifier to the on-disk glue.

## SSR mode

A framework app renders the in-place `?docvia` module directly through its
renderer. The eager source module (`virtual:docvia/source` on Vite,
`docvia/source` on Next) lands content in the SSR bundle — works on Node and the
edge (Cloudflare Workers); the `…/browser` variant (lazy, code-split per page)
loads content client-side without a server round-trip.

For a **non-framework Node server**, `@docvia/ssr`'s `createDocviaSSR()` renders
an IR document through a content source — a `ContentProvider`, a live
`CompileService` (pass it directly), or a `(collection, slug) => IR` function —
with `@docvia/renderer-core`, caching rendered pages in an in-memory LRU keyed
by `contentHash`.

## Which plugin per framework

| Framework             | Plugin / entry            | Notes                                              |
| --------------------- | ------------------------- | -------------------------------------------------- |
| Vite + SvelteKit      | `docvia()` (`@docvia/plugin-vite`) | In-process compile, `virtual:docvia/source` virtual module (dev + build), HMR, in-place `?docvia` transform. |
| Next.js (webpack)     | `withDocvia` (`@docvia/plugin-next`) | Disk glue + `docvia/source` alias + webpack `?docvia` loader rule. |
| Next.js (Turbopack)   | `withDocvia` (`@docvia/plugin-next`) | Same wrapper; `turbopack.resolveAlias` + Turbopack `?docvia` loader rule. |
| Generic / no bundler  | `docvia dev` / `docvia build` (`@docvia/cli`) | Long-lived `CompileService` with incremental `invalidate()`. |
