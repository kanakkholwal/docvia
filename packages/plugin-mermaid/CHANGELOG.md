# @docvia/plugin-mermaid

## 3.0.0

### Major Changes

- 11dfc48: docvia is now seven packages instead of eighteen.
  
  - `@docvia/core` holds everything that runs where docs are served, with no Node APIs, so it runs on Cloudflare Workers and in browsers. It absorbs `@docvia/ir`, `@docvia/schema`, the plugin API from `@docvia/plugins`, `@docvia/renderer-core`, `@docvia/source`, `@docvia/ssr`, `@docvia/renderer-react` and `@docvia/renderer-svelte` as subpaths. React and Svelte are optional peers.
  - `@docvia/build` holds the Node build tooling: `@docvia/runtime`, `@docvia/compiler`, config loading from `@docvia/plugins`, `@docvia/plugin-vite` (now `@docvia/build/vite`) and `@docvia/plugin-next` (now `@docvia/build/next`). `@docvia/core` is its peer dependency.
  - `markdownToIR`, the pipeline every mode shares, is now exported from `@docvia/core/markdown`.
  - `docvia init` installs `@docvia/core` and `@docvia/search`, plus `@docvia/build` and `@docvia/plugin-shiki` as dev dependencies.
  
  Imports move like this:
  
  | Before | After |
  |---|---|
  | `@docvia/ir`, `@docvia/plugins` (`defineConfig`, `PluginRunner`) | `@docvia/core` |
  | `@docvia/core` (`parseMarkdown`) | `@docvia/core/markdown` |
  | `@docvia/schema` | `@docvia/core/schema` |
  | `@docvia/renderer-core` | `@docvia/core/render` |
  | `@docvia/source`, `@docvia/source/macro` | `@docvia/core/source`, `@docvia/core/source/macro` |
  | `@docvia/ssr` | `@docvia/core/ssr` |
  | `@docvia/renderer-react`, `@docvia/renderer-svelte` | `@docvia/core/react`, `@docvia/core/svelte` |
  | `@docvia/renderer-svelte/node` | `@docvia/core/svelte/node` |
  | `@docvia/runtime`, `@docvia/compiler`, `@docvia/plugins` (`loadConfig`, `resolveProject`) | `@docvia/build` |
  | `@docvia/plugin-vite` | `@docvia/build/vite` |
  | `@docvia/plugin-next` | `@docvia/build/next` |

### Patch Changes

- Updated dependencies [11dfc48]
- Updated dependencies [f5ec52e]
- Updated dependencies [11dfc48]
  - @docvia/core@3.0.0

## 2.0.0

### Major Changes

- c3350bb: Production hardening from the baby-ui field report. Breaking:
  
  - `docvia()` is the only Vite plugin; `docviaSourcePlugin` and `docviaMarkdownPlugin` are removed. `docvia()` with no arguments loads `docvia.config.*`.
  - `registry` moved from `virtual:docvia/source` to `virtual:docvia/registry` (`docvia/registry` on Next.js), which always exists.
  - Generated files live in `.docvia/`: `docvia-env.d.ts` is now `.docvia/env.d.ts` and `dynamic.ts` is gone. Add `".docvia/*.d.ts"` to tsconfig `include`. Apps must depend on `@docvia/source` directly.
  - `outDir` and component paths resolve from the project root, not `process.cwd()`. Missing component files fail the build.
  - Packages ship ESM `.js` with an `exports` map (incl. `./package.json`). `@docvia/renderer-svelte` takes `svelte` as a peer.
  - Renderers lose `docviaVitePlugin`, `createInMemoryStore` and `invalidateModules`.
  - `@docvia/schema` drops Zod; `DocPageSchema` is a Standard Schema.
  
  New: `docvia sync`, per-collection `frontmatter`, `optional` collections, `hashExclude`, component globs, fence `title`/`tab`, code groups, npm tabs, renderer `transform` hook, search `records` and result `url`, `defineConfig` from `@docvia/plugin-vite` and `@docvia/plugin-next`.
  
  Fixed: HMR for collections outside the Vite root, renames and deletes in every Vite environment, Windows path casing, and dev pages missing plugin output (e.g. highlighting). Packages are MIT with a LICENSE file each.

### Patch Changes

- c2f9544: `docvia init` adds docs to an existing app, and `docvia.config.ts` is optional.
  
  - `docvia init [dir]` detects Next.js, SvelteKit or TanStack Start, the package manager (lockfile, `packageManager`, user agent) and the app's import aliases. It writes `content/docs`, `lib/source.ts`, docs routes with sidebar and table of contents, a `/api/search` route and starter CSS, adds `docvia()` or `withDocvia()` to the bundler config, excludes `content/` from Tailwind v4 scanning, and installs the packages. New flags: `--yes`, `--no-install`, `--framework`. Breaking: `--renderer` and `--dir` are gone (pass the directory as an argument).
  - Without a config file, the renderer is picked from the app's dependencies (Svelte or React) and Shiki is enabled when `@docvia/plugin-shiki` is installed. A config file that omits `renderer` gets the same detection.
  - `docvia()` (Vite) and `withDocvia()` (Next.js) no longer require `docvia.config.ts`.
  - `DOCVIA_TARBALLS=<dir>` makes `docvia init` install packed tarballs, for trying unreleased builds.
  - `@docvia/plugin-mermaid`: fix a type error under `noUncheckedIndexedAccess`.
- Updated dependencies [c2f9544]
- Updated dependencies [c3350bb]
  - @docvia/ir@2.0.0
