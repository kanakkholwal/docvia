# Technical Documentation & Contributing Guide

Welcome to the **Dockit** technical documentation. This guide is intended for developers looking to understand the core architecture or contribute to the project.

## Architecture Overview

Dockit follows a **Compiler-Grade Architecture** designed for scalability and extensibility.

### 1. The Pipeline
1. **Core Parser (`@dockit/core`):** Micromark-based parser converts markdown strings into a standard `mdast` (Markdown Abstract Syntax Tree).
2. **Plugins (`@dockit/plugins`):** `unified` plugins can intercept and modify the `mdast` before transformation.
3. **IR Transform (`@dockit/ir`):** Converts the `mdast` into our own **Intermediate Representation (IR)** nodes. This is a single-pass DFS that also extracts headings and dependencies.
4. **Compiler (`@dockit/compiler`):** Manages the build lifecycle, handles parallel file processing, uses `xxhash` for content-addressable output, and emits assets.
5. **Renderer (`@dockit/renderer-svelte`):** Takes IR nodes and generates Svelte-compatible JavaScript modules, including pre-rendered Shiki syntax highlighting.

### 2. Intermediate Representation (IR)
Dockit operates on IR rather than raw HTML. This allows different renderers (Svelte, React, Vue) to generate framework-optimized output from the same parsed source.

```typescript
// Example IR Node
{
  type: 'heading',
  props: { depth: 2, id: 'my-heading' },
  children: [ ... ]
}
```

### 3. Incremental Builds
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
git clone https://github.com/your-username/dockit-mvp.git
cd dockit-mvp
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
- [ ] `@dockit/ui` component library.
- [ ] Multi-package documentation support (`docs/` mapping to multiple sub-domains).
- [ ] Integrated dev server with surgical HMR (via Vite).
- [ ] Auto-link and SEO Meta-Tag plugins.

## Questions?
Open an issue or join our community discussions!
