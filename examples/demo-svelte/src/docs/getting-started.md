---
title: Getting Started
description: Learn how to set up Dockit
tags: [guide, tutorial]
order: 1
---

# Getting Started

## Installation

```bash
pnpm add @dockit/cli -D
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `docs/` | Markdown source files |
| `.dockit/` | Compiled output |
| `dockit.config.ts` | Configuration |

## Writing Documentation

Create markdown files in the `docs/` directory:

```markdown
---
title: My Page
description: A description of my page
tags: [example]
---

# My Page

Content goes here.
```

## Building

Run the build command to compile your documentation:

```bash
dockit build
```

This will generate compiled output in the `.dockit/` directory.
