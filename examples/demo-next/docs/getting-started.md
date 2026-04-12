---
title: Getting Started
description: Set up Docvia with Next.js App Router in under 5 minutes.
order: 1
---

# Getting Started

Set up Docvia with Next.js App Router. This guide covers installation, configuration, and creating your first documentation page.

## Installation

Install the core packages:

```bash
npm install @docvia/cli @docvia/renderer-react @docvia/plugin-next shiki
```

## Configuration

Create `docvia.config.ts` in your project root:

```typescript
import { defineConfig } from "@docvia/cli";
import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["typescript", "tsx", "bash", "json"],
    }),
  }),
});
```

Update `next.config.ts` to integrate the plugin:

```typescript
import { withDocvia } from "@docvia/plugin-next";

const withDocs = withDocvia();
export default withDocs({});
```

Add path aliases to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "docvia/source": ["./.docvia/source.ts"],
      "docvia/registry": ["./.docvia/registry.ts"]
    }
  }
}
```

## Create your first page

Create `docs/index.md`:

```markdown
---
title: Welcome
description: My documentation site
---

# Welcome

This is your first documentation page.
```

## Build and preview

```bash
npx docvia build
npx next dev
```

Visit `http://localhost:3000/docs` to see your page.

## Project structure

| Path | Purpose |
| --- | --- |
| `docs/` | Markdown source files |
| `.docvia/` | Generated output (gitignored) |
| `docvia.config.ts` | Docvia configuration |
| `app/docs/` | Next.js routes for documentation |

## Frontmatter fields

Every Markdown file starts with YAML frontmatter:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Page title, used in navigation and metadata |
| `description` | `string` | No | Meta description for SEO |
| `order` | `number` | No | Sort order in navigation |
| `tags` | `string[]` | No | Tags for categorization |
| `slug` | `string` | No | Override the auto-generated slug |
| `draft` | `boolean` | No | Exclude from production builds |

You can extend these with custom fields via a Zod schema in your config. See [Configuration](/docs/configuration) for details.
