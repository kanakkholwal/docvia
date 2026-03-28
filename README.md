# Dockit

**Dockit** is a production-grade, build-time first documentation compiler. It transforms your markdown files into high-performance, searchable, and interactive documentation sites with zero runtime overhead.

## Core Features

- 🚀 **Build-Time First:** Zero runtime markdown parsing. Everything is pre-compiled to optimized JS/JSON.
- ⚡ **High Performance:** Parallel compilation and incremental rebuilds using advanced hashing.
- 🔍 **Full-Text Search:** Integrated section-level search powered by [Orama](https://oramasearch.com/).
- 🎨 **Shiki Highlighting:** Beautiful, accurate syntax highlighting with theme support.
- 🛠️ **Pluggable Architecture:** Extend the pipeline with custom hooks (remark, IR transform, render).
- 📦 **Monorepo Design:** Clean separation of concerns between IR, Core, Compiler, and Renderers.

## Project Structure

Dockit is built as a PNPM monorepo:

| Package | Purpose |
|---------|---------|
| `@dockit/cli` | Command-line interface (`init`, `build`, `dev`). |
| `@dockit/compiler` | Parallel build orchestrator and asset pipeline. |
| `@dockit/ir` | Intermediate Representation types and DFS transformer. |
| `@dockit/core` | Micromark-based markdown parser with unified plugin runner. |
| `@dockit/renderer-svelte` | Svelte-specific IR → JS renderer with Vite support. |
| `@dockit/plugins` | Hook execution engine and configuration loader. |
| `@dockit/search` | Section-level Orama indexing and client search helper. |
| `@dockit/schema` | Frontmatter validation and line-scanner parser. |
| `@dockit/ui` | Shared UI components and sidebar logic. |

## Quick Start

### Installation

```bash
pnpm add @dockit/cli -D
```

### Initialize Project

```bash
npx dockit init
```

### Build Documentation

```bash
npx dockit build
```

## Contributing

We welcome contributions! Please see our [Documentation.md](./documentation.md) for a technical overview of the architecture and instructions on how to set up the development environment.

## License

MIT
