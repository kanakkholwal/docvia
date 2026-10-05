---
"@docvia/cli": major
"@docvia/compiler": major
"@docvia/core": major
"@docvia/ir": major
"@docvia/plugin-mermaid": major
"@docvia/plugin-next": major
"@docvia/plugin-openapi": major
"@docvia/plugin-shiki": major
"@docvia/plugin-vite": major
"@docvia/plugins": major
"@docvia/renderer-core": major
"@docvia/renderer-react": major
"@docvia/renderer-svelte": major
"@docvia/runtime": major
"@docvia/schema": major
"@docvia/search": major
"@docvia/source": major
"@docvia/ssr": major
---

Production hardening from the baby-ui field report. Breaking:

- `docvia()` is the only Vite plugin; `docviaSourcePlugin` and `docviaMarkdownPlugin` are removed. `docvia()` with no arguments loads `docvia.config.*`.
- `registry` moved from `virtual:docvia/source` to `virtual:docvia/registry` (`docvia/registry` on Next.js), which always exists.
- Generated files live in `.docvia/`: `docvia-env.d.ts` is now `.docvia/env.d.ts` and `dynamic.ts` is gone. Add `".docvia/*.d.ts"` to tsconfig `include`. Apps must depend on `@docvia/source` directly.
- `outDir` and component paths resolve from the project root, not `process.cwd()`. Missing component files fail the build.
- Packages ship ESM `.js` with an `exports` map (incl. `./package.json`). `@docvia/renderer-svelte` takes `svelte` as a peer.
- Renderers lose `docviaVitePlugin`, `createInMemoryStore` and `invalidateModules`.
- `@docvia/schema` drops Zod; `DocPageSchema` is a Standard Schema.

New: `docvia sync`, per-collection `frontmatter`, `optional` collections, `hashExclude`, component globs, fence `title`/`tab`, code groups, npm tabs, renderer `transform` hook, search `records` and result `url`, `defineConfig` from `@docvia/plugin-vite` and `@docvia/plugin-next`.

Fixed: HMR for collections outside the Vite root, renames and deletes in every Vite environment, Windows path casing, and dev pages missing plugin output (e.g. highlighting). Packages are MIT with a LICENSE file each.
