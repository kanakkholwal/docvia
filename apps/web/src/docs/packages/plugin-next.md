---
title: "@docvia/plugin-next"
description: "Next.js integration that compiles docvia docs and aliases the compiled artifacts for webpack and Turbopack."
eyebrow: "Packages"
order: 41
---

`@docvia/plugin-next` integrates docvia with Next.js. `withDocvia()` wraps your `next.config`: when the config is evaluated it compiles your docs by driving a [`CompileService`](/docs/packages/runtime), aliases `docvia/source` and `docvia/registry` to the compiled `.docvia/` artifacts for **both webpack and Turbopack**, and — in development — starts an incremental watcher. A cross-process file lock keeps concurrent Next.js processes from compiling at the same time.

## Install

```bash
pnpm add -D @docvia/plugin-next
```

Next.js is a peer dependency: `next >= 14`.

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `withDocvia`, `DocviaNextOptions`. |

There is no `bin` and no other subpath.

## API reference

### `interface DocviaNextOptions`

```ts
interface DocviaNextOptions {
  configPath?: string;
}
```

| Field | Type | Default | Meaning |
|---|---|---|---|
| `configPath` | `string` | `"./docvia.config.ts"` | Path to the docvia config file. |

### `withDocvia`

```ts
function withDocvia(
  options?: DocviaNextOptions,
): (nextConfig?: NextConfig) => (phase: string, context: unknown) => Promise<NextConfig>;
```

A curried wrapper for `next.config`. Calling `withDocvia()` returns a function that takes your existing `NextConfig`; that in turn returns the async `(phase, context)` function Next.js expects.

#### Initialization (`init`, memoized)

On the first invocation, `withDocvia` runs an `init()` step exactly once (the result is memoized):

1. Loads `docvia.config.ts` (or falls back to `defineConfig({})` when no config file is found).
2. Resolves `sourceDir` (default `docs`) and `outDir` (default `.docvia`).
3. **Skips** compilation entirely when there is no renderer configured or the source directory is missing.
4. Acquires the `.docvia-build.lock` cross-process file lock. If another process already holds the lock, it waits up to **60 seconds** for that process to produce `outDir/source.ts`.
5. Constructs a `CompileService` and runs `compileAll()` followed by `emitDiskModuleGraph()`.

Failure handling depends on `phase`:

- In a **production build**, a compile failure is rethrown — the Next.js build fails loudly.
- In **development**, a compile failure is tolerated so the dev server can still start.

#### Development watcher

In dev, `withDocvia` starts a **singleton** watcher over the source directory. Only one watcher is created regardless of how many times the config function runs. Each change recompiles only the affected files through `service.invalidate()` and re-emits the module graph — incremental, not a full rebuild.

#### Returned config

The returned `NextConfig` registers two resolve aliases for **both bundlers** — Next.js may run on webpack or Turbopack, and docvia resolves under either:

| Alias | Target |
|---|---|
| `docvia/source` | `<outDir>/source.ts` (eager, server/SSR) |
| `docvia/source/browser` | `<outDir>/browser.ts` (lazy, client code-split) |
| `docvia/registry` | `<outDir>/registry.ts` |

The aliases are added to a `webpack()` hook *and* to `turbopack.resolveAlias`. Any `webpack()` hook already present on your config is preserved and composed.

It also registers a `.md?docvia` loader for both bundlers (a `module.rules` entry on webpack, a `turbopack.rules` entry on Turbopack) so each Markdown file is compiled as a module **in place** — content lives once in the `.md`, with no emitted JSON.

> The on-disk module graph is used for both webpack and Turbopack — Turbopack has no plugin API, so there is a single resolution path.

## Usage

### Minimal `next.config.mjs`

```js
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia()();
```

### With an existing Next.js config

```js
import { withDocvia } from "@docvia/plugin-next";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withDocvia()(nextConfig);
```

### Custom config path

```js
import { withDocvia } from "@docvia/plugin-next";

export default withDocvia({ configPath: "./config/docvia.config.ts" })({
  reactStrictMode: true,
});
```

### Consuming the compiled source

Because `withDocvia` aliases `docvia/source`, application code can import the generated source directly:

```ts
import { docviaSource } from "docvia/source";

const page = await docviaSource.collections.docs.getPage(["getting-started"]);
```
