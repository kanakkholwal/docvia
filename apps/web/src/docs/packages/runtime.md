---
title: "@docvia/runtime"
description: "CompileService: the stateful compile core shared by the build, the dev server, and SSR."
eyebrow: "Packages"
order: 15
---

`@docvia/runtime` is docvia's compile core. It exposes **`CompileService`**, a
stateful, long-lived object that holds the resolved config, the plugin runner,
the incremental cache, and the in-memory module graph for the lifetime of a
process.

Every docvia mode drives this one service, which is why build, dev, and
request-time output never drift apart:

- [`@docvia/compiler`](/docs/packages/compiler)'s `compile()` is a thin wrapper over
  `CompileService`, giving a behaviour-identical batch build.
- [`@docvia/plugin-vite`](/docs/packages/plugin-vite) and
  [`@docvia/plugin-next`](/docs/packages/plugin-next) run the service in-process for
  incremental dev compilation.
- [`@docvia/ssr`](/docs/packages/ssr) renders documents resolved through the service
  A live `CompileService` is itself a valid `ContentSource`, so it can be
  passed straight to `createDocviaSSR({ provider })`.

> `@docvia/runtime` is the engine, not a public-facing API surface. Most
> projects consume `@docvia/compiler` or a framework plugin instead. This page
> documents the core for plugin and adapter authors.

## Installation

```bash
pnpm add @docvia/runtime
```

Requires Node.js `>=20.0.0`. ESM only.

## Why a stateful service?

The original `compile()` was batch, stateless, and disk-based. That suits a
one-shot build, but a poor fit for a dev server that needs to recompile a
single changed file, or for SSR that needs to render one document on demand.

`CompileService` keeps that state in memory so all three modes share a single
render path:

- **Config and plugins** are resolved once and reused.
- **The incremental cache** lives in memory and is consulted on every compile.
- **The module graph** is held in memory; it can be emitted to disk or served
  as a virtual module.

## API reference

### `CompileService`

```ts
class CompileService {
  constructor(options: CompileServiceOptions);
}
```

Key methods:

| Method | Purpose |
|---|---|
| `compileAll()` | Compile every file in the source tree (the build path). |
| `compileFile(path)` | Compile a single file on demand. |
| `invalidate(filePaths)` | Incrementally recompile changed files; returns an `InvalidationResult` with `changed` and `routeMapChanged`. |
| `getDocument(collection, slug)` | Resolve a compiled `IRDocument` by route. |
| `getDocumentByPath(path)` | Resolve a compiled document by source path. |
| `emitDiskModuleGraph()` | Write the on-disk module graph (thin `?docvia` glue; no IR chunks). |
| `getVirtualSourceModule()` | Produce the eager source module as a string (for virtual-module bundler integrations, e.g. `virtual:docvia/source`). |
| `getVirtualBrowserModule()` | Produce the lazy, client-code-split browser module as a string (`virtual:docvia/source/browser`). |
| `emitTypeDeclarations()` | Write `types.d.ts` and `docvia-env.d.ts`. |

### `InvalidationResult`

```ts
interface InvalidationResult {
  readonly changed: string[];        // routes whose output changed
  readonly routeMapChanged: boolean; // whether the set of routes changed
}
```

Dev integrations use this to decide between a hot module swap (`changed` only)
and a full reload (`routeMapChanged`).

## See also

- [Architecture](/docs/guide/architecture): how the compile core fits the three
  run modes.
- [`@docvia/compiler`](/docs/packages/compiler): the batch build wrapper.
- [`@docvia/ssr`](/docs/packages/ssr): request-time rendering.
