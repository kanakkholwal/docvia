---
title: "@docvia/plugins"
description: "The plugin runtime and config layer: plugin ordering, lifecycle hook execution, and defineConfig / loadConfig."
eyebrow: "Packages"
order: 14
---

`@docvia/plugins` is the plugin runtime and configuration layer of docvia. It does two jobs. First, it validates and orders the configured plugins, then runs their lifecycle hooks during a build, wrapping any failure in a `docviaError` that names the offending plugin. Second, it provides the configuration helpers — `defineConfig` for authoring a config and `loadConfig` for loading one from disk.

The package depends on `@docvia/ir` (for the plugin and config contracts and the error class) and [`jiti`](https://github.com/unjs/jiti) (to import TypeScript config files at runtime without a separate build step).

## Installation

```bash
pnpm add @docvia/plugins
```

Requires Node.js `>=20.0.0`. ESM only.

## Exports

`@docvia/plugins` exposes a single entry point.

| Subpath | Module | Contents |
| --- | --- | --- |
| `.` | `./dist/index.mjs` | `resolvePlugins`, the `PluginRunner` class, `defineConfig`, and `loadConfig`. |

```ts
import {
  resolvePlugins,
  PluginRunner,
  defineConfig,
  loadConfig,
} from "@docvia/plugins";
```

## Plugin resolution

### `resolvePlugins`

```ts
function resolvePlugins(
  plugins: readonly docviaPlugin[],
): readonly docviaPlugin[]
```

Validates a plugin list and returns it sorted into execution order.

**Validation** — every plugin is checked, and a `docviaError` with code `PLUGIN_ERROR` is thrown if any of the following holds:

| Condition | Error message |
| --- | --- |
| A plugin has no `name` | `Plugin missing name` |
| A plugin has no `version` | `Plugin "<name>" missing version` |
| Two plugins share a `name` | `Duplicate plugin: "<name>"` |

**Ordering** — valid plugins are sorted by phase first, then by priority:

1. **Phase** — `pre` plugins run before `normal`, which run before `post`. A plugin with no `phase` is treated as `normal`.
2. **Priority** — within a phase, plugins are sorted by ascending `priority`; **lower runs first**. A plugin with no `priority` is treated as `100`.

The input array is not mutated; a sorted copy is returned.

## The plugin runner

### `PluginRunner`

```ts
class PluginRunner {
  constructor(plugins: readonly docviaPlugin[]);
  runBeforeParse(file: FileEntry): Promise<FileEntry>;
  runAfterParse(ast: unknown, file: FileEntry): Promise<unknown>;
  runBeforeTransform(ast: unknown, meta: FrontmatterData): Promise<unknown>;
  runAfterTransform(doc: IRDocument): Promise<IRDocument>;
  runBeforeRender(doc: IRDocument): Promise<IRDocument>;
  getPluginCacheKeys(): string[];
}
```

The `PluginRunner` drives the plugin lifecycle for a build. The constructor passes the plugin list through `resolvePlugins`, so a runner always holds validated, correctly ordered plugins.

Each `run*` method corresponds to one lifecycle hook. For a given hook, the runner iterates the resolved plugins in order; for each plugin that implements that hook, it feeds the **output of the previous plugin** into the next. The hooks form a transformation chain — every plugin gets the chance to inspect or rewrite the value as it flows through.

| Method | Hook | Input → output |
| --- | --- | --- |
| `runBeforeParse` | `beforeParse` | `FileEntry` → `FileEntry` |
| `runAfterParse` | `afterParse` | parsed AST → AST |
| `runBeforeTransform` | `beforeTransform` | AST (with `FrontmatterData`) → AST |
| `runAfterTransform` | `afterTransform` | `IRDocument` → `IRDocument` |
| `runBeforeRender` | `beforeRender` | `IRDocument` → `IRDocument` |

**Error wrapping** — every hook call is wrapped. If a hook throws something that is already a `docviaError`, it propagates unchanged. Anything else is re-wrapped as a `docviaError` with code `PLUGIN_ERROR` and a message of the form `Plugin "<name>@<version>" failed in <hook>: <reason>`, with the original error attached as `cause`. For the file-bound hooks (`beforeParse`, `afterParse`) the file path is attached too.

### `getPluginCacheKeys`

```ts
getPluginCacheKeys(): string[]
```

Returns one cache key per plugin, in resolved order. If a plugin implements `cacheKey()`, its return value is used; otherwise the key defaults to `<name>@<version>`. The compiler folds these keys into the build cache so changing a plugin (or its `cacheKey()` output) invalidates affected entries.

## Configuration helpers

### `defineConfig`

```ts
function defineConfig(config: Partial<docviaConfig>): docviaConfig
```

Takes a partial config and returns a fully resolved `docviaConfig`, filling in every default. This is the function users call in their `docvia.config.ts`.

| Field | Default |
| --- | --- |
| `sourceDir` | `"docs"` |
| `outDir` | `".docvia"` |
| `plugins` | `[]` |
| `renderer` | `undefined` (passed through) |
| `components` | `undefined` (passed through) |
| `collections` | `undefined` (passed through) |
| `frontmatter` | `undefined` (passed through) |
| `markdown.remarkPlugins` | `[]` |
| `syntax.highlighter` | `"shiki"` |
| `syntax.theme` | `"github-dark"` |
| `syntax.langs` | `["javascript", "typescript", "bash", "json", "css", "html", "svelte"]` |
| `theme.name` | `"default"` |
| `theme.options` | `{}` |

### `loadConfig`

```ts
function loadConfig(configPath: string): Promise<docviaConfig>
```

Loads a config file from disk and returns a resolved `docviaConfig`. The steps:

1. Resolves `configPath` to an absolute path.
2. Imports the module with `jiti`, so a TypeScript config file runs directly with no separate compile step. The `jiti` instance is created with `moduleCache: false` and `fsCache: false` so config changes are always picked up.
3. Unwraps a `default` export if present (the typical `export default defineConfig({...})` form), otherwise uses the module itself.
4. Passes the result through `defineConfig` to apply defaults.

Failure modes — both throw a `docviaError` with code `CONFIG_ERROR`:

| Condition | Behavior |
| --- | --- |
| The import itself fails | Error message `Failed to load config: <path>` plus the underlying message; the original error is attached as `cause`. |
| The module does not export an object | Error message noting the actual type and suggesting `export default defineConfig({...})`. |

## Writing a plugin

A plugin is a plain object satisfying the `docviaPlugin` interface from `@docvia/ir`. Only `name` and `version` are required; implement just the hooks you need.

```ts
import type { docviaPlugin } from "@docvia/ir";

export function readingTimePlugin(): docviaPlugin {
  return {
    name: "reading-time",
    version: "1.0.0",
    phase: "post",
    priority: 50,
    cacheKey() {
      // Bump this string to invalidate cached pages when the plugin changes.
      return "reading-time@1.0.0";
    },
    afterTransform(doc) {
      const words = JSON.stringify(doc.children).split(/\s+/).length;
      return {
        ...doc,
        frontmatter: {
          ...doc.frontmatter,
          readingMinutes: Math.ceil(words / 200),
        },
      };
    },
  };
}
```

## Usage example

Authoring a config and running plugins through a `PluginRunner`:

```ts
import { defineConfig, loadConfig, PluginRunner } from "@docvia/plugins";
import { readingTimePlugin } from "./plugins/reading-time";

// Author a config inline...
export default defineConfig({
  sourceDir: "docs",
  plugins: [readingTimePlugin()],
  syntax: { highlighter: "shiki", theme: "github-dark", langs: ["ts", "bash"] },
});

// ...or load one from disk.
const config = await loadConfig("./docvia.config.ts");

// Drive the plugin lifecycle (this is what @docvia/compiler does internally).
const runner = new PluginRunner(config.plugins);
const cacheKeys = runner.getPluginCacheKeys();
const file = await runner.runBeforeParse({
  path: "/abs/docs/intro.md",
  relativePath: "intro.md",
  content: rawSource,
  hash: fileHash,
});
```
