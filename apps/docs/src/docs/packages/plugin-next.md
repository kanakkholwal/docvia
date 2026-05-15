---
title: "@docvia/plugin-next"
description: "Next.js integration that compiles docvia docs and aliases the compiled artifacts in webpack."
eyebrow: "Packages"
order: 41
---

`@docvia/plugin-next` integrates docvia with Next.js. `withDocvia()` wraps your `next.config`: when the config is evaluated it compiles your docs via `@docvia/compiler`'s `compile()`, aliases `docvia/source` and `docvia/registry` to the compiled `.docvia/` artifacts in webpack, and — in development — starts a chokidar watcher. A cross-process file lock keeps concurrent Next.js processes from compiling at the same time.

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
5. Runs `compile()`.

Failure handling depends on `phase`:

- In a **production build**, a compile failure is rethrown — the Next.js build fails loudly.
- In **development**, a compile failure is tolerated so the dev server can still start.

#### Development watcher

In dev, `withDocvia` starts a **singleton** chokidar watcher over the source directory. Only one watcher is created regardless of how many times the config function runs.

#### Returned config

The returned `NextConfig` adds (or extends) a `webpack()` hook that registers two resolve aliases:

| Alias | Target |
|---|---|
| `docvia/source` | `<outDir>/source.ts` |
| `docvia/registry` | `<outDir>/registry.ts` |

Any `webpack()` hook already present on your config is preserved and composed.

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

Because `withDocvia` aliases the virtual specifiers, application code can import them directly:

```ts
import { source } from "docvia/source";

const page = await source.collections.docs.getPage(["getting-started"]);
```
