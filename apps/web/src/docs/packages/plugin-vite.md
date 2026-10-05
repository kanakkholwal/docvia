---
title: "@docvia/plugin-vite"
description: "The docvia() Vite plugin: compiles defineDocs() collections and Markdown pages on demand, with HMR."
eyebrow: "Packages"
order: 40
---

`@docvia/plugin-vite` integrates docvia into any Vite-based app (SvelteKit,
React + Vite, TanStack Start). **`docvia()`** is its only plugin. It rewrites
`defineDocs()` / `defineRegistry()` calls at build time and compiles each page in
memory when it is first loaded, so there is no separate `docvia build` step and no
`.docvia/` folder.

```bash
pnpm add -D @docvia/plugin-vite
pnpm add @docvia/source
```

`vite` (`^8`) and `@docvia/source` are peer dependencies. The generated code
imports `@docvia/source`, so the plugin fails at startup with a `CONFIG_ERROR`
when your app cannot resolve it.

Requires Node.js `>=20.0.0`. ESM only.

## Package exports

| Subpath | Contents |
|---|---|
| `.` | `docvia`, the Vite plugin; `defineConfig`; the `DocviaVitePluginOptions` type. |
| `./package.json` | Package metadata. |

## `docvia()`

```ts
function docvia(config?: docviaConfig, options?: DocviaVitePluginOptions): Plugin;

interface DocviaVitePluginOptions {
  configPath?: string | false; // relative to the Vite root; auto-detected
}
```

Called with no config, `docvia()` loads `docvia.config.*` from the Vite root and
restarts the dev server when it changes. Passing a config object also works.

```ts title="vite.config.ts"
import { docvia } from "@docvia/plugin-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [docvia()], // loads ./docvia.config.ts
});
```

In SvelteKit, add it alongside `sveltekit()`. Then declare the collection in any
module (every non-`node_modules` file that imports `@docvia/source/macro` is
transformed):

```ts title="src/lib/source.ts"
import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
```

What the plugin does:

- **Macro transform.** `defineDocs()` becomes an index of the folder's
  frontmatter plus a lazy import per page body. `defineRegistry()` becomes real
  imports of the `components` in your config.
- **On-demand compile.** A page body compiles when `page.data.load()` first
  imports it, in memory, keyed by content hash.
- **HMR.** A body edit hot-swaps that page. Frontmatter edits, adds and deletes
  re-index the collection and reload, with no dev-server restart. Collection
  directories outside the Vite root are watched too. Compile errors surface in
  Vite's error overlay.
- **Dependency config.** The renderer's runtime package is added to
  `ssr.noExternal` and `optimizeDeps.include` for you.

See [Framework integration](/docs/guide/frameworks) for SvelteKit, React + Vite
and TanStack Start walkthroughs.

> **Legacy config collections.** Collections declared in `docvia.config.ts` are
> still served as `virtual:docvia/source` and `virtual:docvia/registry`, with types
> written to `.docvia/*.d.ts` in dev.

## See also

- [`@docvia/source`](/docs/packages/source): `defineDocs()` and `loader()`.
- [`@docvia/runtime`](/docs/packages/runtime): the page pipeline the plugin runs.
