---
title: Welcome to docvia
description: Fast, modern documentation with docvia
tags: [getting-started]
---

# Welcome to docvia

Fast, modern documentation powered by docvia. Build-time compilation, zero runtime overhead, and a beautiful UI out of the box.

## Why docvia?

- **Build-time compilation** — Zero runtime markdown parsing overhead
- **Incremental rebuilds** — Only recompile changed pages
- **Developer-first** — Minimal dependencies, maximum control
- **Full-text search** — Powered by Orama search engine
- **Plugin system** — Extend with custom renderers and hooks
- **Beautiful UI** — Modern, minimal design included

## Quick Start

Install docvia in your SvelteKit project:

```bash
npm install -D @docvia/cli @docvia/compiler @docvia/source
```

Initialize your documentation:

```bash
docvia init
```

Start the development server:

```bash
docvia dev
```

Your docs will be available at `http://localhost:5173`.

## Key Features

### Zero Runtime Parsing

All markdown is compiled at build time. Your documentation renders instantly with zero JavaScript parsing overhead.

### Incremental Compilation

Changes to one page don't require recompiling your entire documentation. Only affected files are reprocessed, making development fast.

### Extensible

Use the plugin system to add custom renderers, transformations, or hooks to your documentation pipeline.

### Search-Ready

Full-text search is built-in and powered by Orama. Search your entire documentation with lightning speed.

## What's Next?

Explore the documentation to learn more about [components](./components) and advanced configuration.
