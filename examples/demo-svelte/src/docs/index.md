---
title: Welcome to Dockit
description: Fast, modern documentation with Dockit
tags: [getting-started]
---

# Welcome to Dockit

Fast, modern documentation powered by Dockit. Build-time compilation, zero runtime overhead, and a beautiful UI out of the box.

## Why Dockit?

- **Build-time compilation** — Zero runtime markdown parsing overhead
- **Incremental rebuilds** — Only recompile changed pages
- **Developer-first** — Minimal dependencies, maximum control
- **Full-text search** — Powered by Orama search engine
- **Plugin system** — Extend with custom renderers and hooks
- **Beautiful UI** — Modern, minimal design included

## Quick Start

Install Dockit in your SvelteKit project:

```bash
npm install -D @dockit/cli @dockit/compiler @dockit/source
```

Initialize your documentation:

```bash
dockit init
```

Start the development server:

```bash
dockit dev
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
