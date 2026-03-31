# docvia

**docvia** is a production-grade, build-time first documentation compiler. It transforms your markdown files into high-performance, searchable, and interactive documentation sites with zero runtime overhead.

## Core Features

- 🚀 **Build-Time First:** Zero runtime markdown parsing. Everything is pre-compiled to optimized JS/JSON.
- ⚡ **High Performance:** Parallel compilation and incremental rebuilds using advanced hashing.
- 🔍 **Full-Text Search:** Integrated section-level search powered by [Orama](https://oramasearch.com/).
- 🎨 **Shiki Highlighting:** Beautiful, accurate syntax highlighting with theme support.
- 🛠️ **Pluggable Architecture:** Extend the pipeline with custom hooks (remark, IR transform, render).
- 📦 **Monorepo Design:** Clean separation of concerns between IR, Core, Compiler, and Renderers.

## Project Structure

docvia is built as a PNPM monorepo:

| Package | Purpose |
|---------|---------|
| `@docvia/cli` | Command-line interface (`init`, `build`, `dev`). |
| `@docvia/compiler` | Parallel build orchestrator and asset pipeline. |
| `@docvia/ir` | Intermediate Representation types and DFS transformer. |
| `@docvia/core` | Micromark-based markdown parser with unified plugin runner. |
| `@docvia/renderer-svelte` | Svelte-specific IR → JS renderer with Vite support. |
| `@docvia/plugins` | Hook execution engine and configuration loader. |
| `@docvia/search` | Section-level Orama indexing and client search helper. |
| `@docvia/schema` | Frontmatter validation and line-scanner parser. |
| `@docvia/ui` | Shared UI components and sidebar logic. |

## Quick Start

### Installation

```bash
pnpm add @docvia/cli -D
```

### Initialize Project

```bash
npx docvia init
```

### Build Documentation

```bash
npx docvia build
```

## Contributing

We welcome contributions! Please see our [Documentation.md](./documentation.md) for a technical overview of the architecture and instructions on how to set up the development environment.

## License

MIT
