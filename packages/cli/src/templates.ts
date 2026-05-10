// Scaffold templates emitted by `docvia init`.
// Kept separate from the command file so each template is easy to update.

export type RendererTemplate = "react" | "svelte" | "none";

export interface ScaffoldFiles {
	configFile: string;
	indexMd: string;
	gettingStartedMd: string;
	componentsMd: string;
}

const indexMd = `---
title: Welcome to docvia
description: Your documentation starts here
tags: [getting-started]
---

# Welcome to docvia

This is your documentation home page. Edit \`docs/index.md\` to get started.

## Features

- **Build-time compilation** — Zero runtime markdown parsing
- **Typed frontmatter** — Validated with Zod, generated to TypeScript
- **Full-text search** — Powered by Orama
- **Plugin system** — Extend with custom hooks

## Quick Start

\`\`\`bash
docvia build
docvia dev
\`\`\`
`;

const gettingStartedMd = `---
title: Getting Started
description: Learn how to set up docvia
tags: [guide, tutorial]
order: 1
---

# Getting Started

## Installation

\`\`\`bash
pnpm add -D @docvia/cli
\`\`\`

## Project Structure

| Directory | Purpose |
|-----------|---------|
| \`docs/\` | Markdown source files |
| \`.docvia/\` | Compiled output (gitignored) |
| \`docvia.config.ts\` | Configuration |

## Writing Documentation

Create markdown files in the \`docs/\` directory:

\`\`\`markdown
---
title: My Page
description: A description of my page
tags: [example]
---

# My Page

Content goes here.
\`\`\`

## Building

\`\`\`bash
docvia build
\`\`\`

This compiles your documentation into \`.docvia/\`.
`;

const componentsMd = `---
title: Components
description: Embedding custom components via directives
tags: [advanced, components]
order: 2
---

# Components

docvia supports custom components via directive syntax.

## Usage

Use \`:::name\` to embed a registered component:

:::note
This is a note component rendered via the directive system.
:::

:::warning
This is a warning — handle with care!
:::

## Code Examples

\`\`\`typescript
import { defineConfig } from '@docvia/cli';

export default defineConfig({
  sourceDir: 'docs',
  outDir: '.docvia',
  plugins: [],
});
\`\`\`
`;

const reactConfig = `import { defineConfig } from "@docvia/cli";
import {
  createReactRenderer,
  createShikiHighlighter,
} from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",

  // Optional: register components referenced by ::: directives
  // components: {
  //   counter: { path: "./components/Counter", hydrate: true },
  // },

  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["javascript", "typescript", "tsx", "jsx", "bash", "json", "css", "html"],
    }),
  }),
});
`;

const svelteConfig = `import { defineConfig } from "@docvia/cli";
import {
  createShikiHighlighter,
  createSvelteRenderer,
} from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",

  // Optional: register components referenced by ::: directives
  // components: {
  //   counter: { path: "./src/lib/components/Counter.svelte", hydrate: true },
  // },

  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["javascript", "typescript", "svelte", "html", "css", "bash", "json"],
    }),
  }),
});
`;

const stubConfig = `import { defineConfig } from "@docvia/cli";

// IMPORTANT: docvia needs a renderer to build. Install one of:
//   pnpm add @docvia/renderer-react   (for React/Next.js)
//   pnpm add @docvia/renderer-svelte  (for Svelte/SvelteKit)
//
// Then uncomment the renderer block below.

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  plugins: [],

  // renderer: createReactRenderer({ highlighter: createShikiHighlighter({ theme: "github-dark" }) }),
});
`;

export function getScaffold(renderer: RendererTemplate): ScaffoldFiles {
	const configFile =
		renderer === "react"
			? reactConfig
			: renderer === "svelte"
				? svelteConfig
				: stubConfig;
	return { configFile, indexMd, gettingStartedMd, componentsMd };
}

export function installHint(renderer: RendererTemplate): string {
	switch (renderer) {
		case "react":
			return "pnpm add @docvia/renderer-react react react-dom";
		case "svelte":
			return "pnpm add @docvia/renderer-svelte svelte";
		case "none":
			return "pnpm add @docvia/renderer-react   # or @docvia/renderer-svelte";
	}
}
