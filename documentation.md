# Technical Documentation & Contributing Guide

Welcome to the **docvia** technical documentation. This guide is intended for developers looking to understand the core architecture or contribute to the project.

## Architecture Overview

docvia follows a **Compiler-Grade Architecture** designed for scalability and extensibility.

### 1. The Pipeline
1. **Core Parser (`@docvia/core`):** Micromark-based parser converts markdown strings into a standard `mdast` (Markdown Abstract Syntax Tree).
2. **Plugins (`@docvia/plugins`):** `unified` plugins can intercept and modify the `mdast` before transformation.
3. **IR Transform (`@docvia/ir`):** Converts the `mdast` into our own **Intermediate Representation (IR)** nodes. This is a single-pass DFS that also extracts headings and dependencies.
4. **Compile core (`@docvia/runtime`):** A stateful, long-lived `CompileService` owns the resolved config, plugin runner, incremental cache, and module graph. It exposes `compileAll()`, incremental `invalidate()`, `getDocument()`, and module-graph / IR-chunk emitters.
5. **Renderer (`@docvia/renderer-core` + adapters):** Takes IR nodes and produces framework output. Syntax highlighting is a build-time plugin (`@docvia/plugin-shiki`) that bakes highlighted HTML into the IR — no highlighter ships at runtime.

### 2. Run modes

One `CompileService` backs three modes — see [MODES.md](./MODES.md) for the full breakdown:

- **Build** — `@docvia/compiler`'s `compile()` (a thin wrapper over `CompileService`) compiles the whole tree once and emits the on-disk module graph plus per-route IR chunks.
- **Dev** — the bundler plugins (`@docvia/plugin-vite`, `@docvia/plugin-next`) run `CompileService` in-process and recompile incrementally via `service.invalidate()` on every file change.
- **SSR** — `@docvia/ssr` renders a single document per request, on Node (`FsContentProvider`) or the edge (`BundledContentProvider`), cached in an in-memory LRU.

Because every mode shares one render path, build, dev, and request-time output are identical.

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
We use a **DAG (Directed Acyclic Graph)** based approach for incremental builds. Every file's output hash is a composite of:
- Source content hash
- Frontmatter data
- Config hash
- Plugin cache keys

This ensures that only changed files (and their dependents) are recomputed.

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
