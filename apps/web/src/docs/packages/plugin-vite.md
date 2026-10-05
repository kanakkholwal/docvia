---
title: "@docvia/plugin-vite"
description: "The in-process docvia() Vite plugin: virtual modules, incremental HMR, and a production module graph."
eyebrow: "Packages"
order: 40
---

`@docvia/plugin-vite` integrates docvia into any Vite-based app (plain Vite or
SvelteKit). **`docvia()`** is its only plugin: it runs the
[`CompileService`](/docs/packages/runtime) in-process, so there is no separate
`docvia build` step.

```bash
pnpm add -D @docvia/plugin-vite
pnpm add @docvia/source
```

`vite` (`^8`) and `@docvia/source` are peer dependencies. The generated
modules import `@docvia/source`, so the plugin fails at startup with a
`CONFIG_ERROR` when your app cannot resolve it.

Requires Node.js `>=20.0.0`. ESM only.

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `docvia`, the in-process Vite plugin; `defineConfig`; the `DocviaVitePluginOptions` type. |
| `./package.json` | Package metadata. |

## `docvia()`, the in-process plugin

```ts
function docvia(config?: docviaConfig, options?: DocviaVitePluginOptions): Plugin;

interface DocviaVitePluginOptions {
  noCache?: boolean; // ignore the incremental cache
  configPath?: string | false; // relative to the Vite root; auto-detected
}
```

Called with no arguments, `docvia()` loads `docvia.config.*` from the Vite root.
Passing a config object still works. The plugin owns the whole integration:

- **Virtual modules.** It serves three modules from its `load` hook in **dev and
  build alike**:

  | Module | Contents |
  |---|---|
  | `virtual:docvia/source` | Eager collections, for server/SSR. Importing it from client code logs a warning, because it bundles every page. |
  | `virtual:docvia/source/browser` | Lazy collections, one code-split chunk per page. |
  | `virtual:docvia/registry` | The component registry. Always present, possibly empty. |

- **HMR.** A content change hot-swaps the `.md?docvia` module. Adding, renaming,
  or deleting a page regenerates the virtual modules and reloads, with no
  dev-server restart. Every collection's `sourceDir` is watched, including
  directories outside the Vite root. Compile errors surface in Vite's error
  overlay.
- **`.md?docvia` transform.** Compiles each Markdown file as a module in place
  (through the shared core transform), so content lives once in the `.md` and the
  virtual source modules just import it.
- **Dependency config.** The renderer's runtime package is added to
  `ssr.noExternal` and `optimizeDeps.include` for you, so you do not configure
  either.
- **Types.** `.docvia/types.d.ts` and `.docvia/env.d.ts` are written when the
  server or build starts. Add `".docvia/*.d.ts"` to your `tsconfig.json`
  `include`, and run [`docvia sync`](/docs/guide/cli) before type-checking in CI.

```ts
// vite.config.ts
import { docvia } from "@docvia/plugin-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [docvia()], // loads ./docvia.config.ts
});
```

That is the complete setup. See
[Framework integration](/docs/guide/frameworks) for the full SvelteKit walkthrough.

```ts
// A single page can also be imported directly through the ?docvia transform.
import page from "./docs/index.md?docvia";
```

## See also

- [Framework integration](/docs/guide/frameworks): SvelteKit and plain Vite setups.
- [`@docvia/runtime`](/docs/packages/runtime): the `CompileService` the plugin runs.
