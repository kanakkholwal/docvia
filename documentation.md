# Technical Documentation & Contributing Guide

Welcome to the **docvia** technical documentation. This guide is intended for developers looking to understand the core architecture or contribute to the project.

## Architecture Overview

docvia follows a **Compiler-Grade Architecture** designed for scalability and extensibility.

### 1. The Pipeline
1. **Core Parser (`@docvia/core`):** Micromark-based parser converts markdown strings into a standard `mdast` (Markdown Abstract Syntax Tree).
2. **Plugins (`@docvia/plugins`):** `unified` plugins can intercept and modify the `mdast` before transformation.
3. **IR Transform (`@docvia/ir`):** Converts the `mdast` into our own **Intermediate Representation (IR)** nodes. This is a single-pass DFS that also extracts headings and dependencies.
4. **Page pipeline (`@docvia/runtime`):** `PagePipeline` reads frontmatter and compiles page bodies; the macro transform rewrites `defineDocs()` / `defineRegistry()` calls (`@docvia/source/macro`) into a frontmatter index plus lazy per-page imports. Bodies compile in memory, keyed by content hash; nothing is written to disk.
5. **Renderer (`@docvia/renderer-core` + adapters):** Takes IR nodes and produces framework output. Syntax highlighting is a build-time plugin (`@docvia/plugin-shiki`) that bakes highlighted HTML into the IR, so no highlighter ships at runtime.

### 2. Run modes

- **Bundler (recommended):** `@docvia/plugin-vite` and `@docvia/plugin-next` (webpack + Turbopack) run the macro transform in-process. Apps read pages through `loader()` from `@docvia/source`: `source.getPage(slugs)` returns frontmatter synchronously and `page.data.load()` compiles the body on first call. Dev recompiles changed pages on HMR.
- **SSR:** framework apps call `page.data.load()` on the server (Node or edge); bodies stay lazy, so cold start stays small. `@docvia/ssr` covers non-framework Node servers (pass a `CompileService` straight to `createDocviaSSR`), cached in an in-memory LRU.
- **Legacy config collections:** `collections` in `docvia.config.ts` with `virtual:docvia/source` / `docvia/source` imports, and the standalone `@docvia/compiler` / CLI build. See [MODES.md](./MODES.md).

Every mode shares one render path, so output is identical.

### 3. Intermediate Representation (IR)
docvia operates on IR rather than raw HTML. This allows different renderers (Svelte, React, Vue) to generate framework-optimized output from the same parsed source.

```typescript
// Example IR Node
{
  type: 'heading',
  props: { depth: 2, id: 'my-heading' },
  children: [ ... ]
}
```

### 4. Incremental Builds
Compiled pages are cached in memory, keyed by a hash of:
- Source content
- Frontmatter data
- Config hash
- Plugin cache keys
- Dependency hashes

Only changed pages recompile. There is no on-disk cache.

## Development Setup

### Prerequisites
- Node.js 20+
- PNPM 9+

### Monorepo Installation
```bash
git clone https://github.com/kanakkholwal/docvia.git
cd docvia
pnpm install
```

### Building All Packages
```bash
pnpm build
```

### Running the CLI Locally
You can test the CLI by running it directly from the `dist` of the `packages/cli`:
```bash
node ./packages/cli/dist/index.js init
```

## Contributing Workflow

1. **Fork & Branch:** Create a feature branch from `main`.
2. **Strict ESM:** We only use ESM. Ensure all imports use the `.js` extension (even for `.ts` files).
3. **Type Safety:** Maintain strict TypeScript mode. Run `pnpm build` to verify types.
4. **Biome:** We use Biome for linting and formatting. Run `npx biome check .` before committing.
5. **PR Guidelines:** Keep PRs focused on a single feature or bug fix.

## Roadmap
- [x] Stateful `CompileService` shared by build, dev, and SSR.
- [x] In-process dev compilation with surgical HMR (Vite + Next.js).
- [x] Request-time SSR for Node and edge runtimes.
- [x] Pluggable, build-time syntax highlighting.
- [ ] `@docvia/ui` component library.
- [ ] Multi-package documentation support (`docs/` mapping to multiple sub-domains).
- [ ] Client/render-time re-highlighting (theme switching).
- [ ] Auto-link and SEO Meta-Tag plugins.

## Questions?
Open an issue or join our community discussions!
