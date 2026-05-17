// Scaffold templates emitted by `docvia init`.
// Kept separate from the command file so each template is easy to update.
import { addCmd, type PackageManager } from "./pm";

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
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",

  // Optional: register components referenced by ::: directives
  // components: {
  //   counter: { path: "./components/Counter", hydrate: true },
  // },

  renderer: createReactRenderer(),

  // Syntax highlighting is a build-time plugin — the highlighted HTML is baked
  // into the IR, so no highlighter ships to the browser.
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["javascript", "typescript", "tsx", "jsx", "bash", "json", "css", "html"],
    }),
  ],
});
`;

const svelteConfig = `import { defineConfig } from "@docvia/cli";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",

  // Optional: register components referenced by ::: directives
  // components: {
  //   counter: { path: "./src/lib/components/Counter.svelte", hydrate: true },
  // },

  renderer: createSvelteRenderer(),

  // Syntax highlighting is a build-time plugin — the highlighted HTML is baked
  // into the IR, so no highlighter ships to the browser.
  plugins: [
    shiki({
      theme: "github-dark",
      langs: ["javascript", "typescript", "svelte", "html", "css", "bash", "json"],
    }),
  ],
});
`;

// `stubConfig` is a function because its install hints depend on the chosen
// package manager.
function stubConfig(pm: PackageManager): string {
	return `import { defineConfig } from "@docvia/cli";

// IMPORTANT: docvia needs a renderer to build. Install one of:
//   ${addCmd(pm, "@docvia/renderer-react")}   (for React/Next.js)
//   ${addCmd(pm, "@docvia/renderer-svelte")}  (for Svelte/SvelteKit)
//
// For syntax highlighting, also install the build-time plugin:
//   ${addCmd(pm, "@docvia/plugin-shiki", true)}
//
// Then uncomment the renderer and plugin blocks below.

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  plugins: [],

  // renderer: createReactRenderer(),
  // plugins: [shiki({ theme: "github-dark" })],
});
`;
}

export function getScaffold(
	renderer: RendererTemplate,
	pm: PackageManager,
): ScaffoldFiles {
	const configFile =
		renderer === "react"
			? reactConfig
			: renderer === "svelte"
				? svelteConfig
				: stubConfig(pm);
	return { configFile, indexMd, gettingStartedMd, componentsMd };
}

/** The runtime-peer install command suggested after `docvia init`. */
export function installHint(
	renderer: RendererTemplate,
	pm: PackageManager,
): string {
	switch (renderer) {
		case "react":
			return `${addCmd(pm, "@docvia/renderer-react react react-dom")} && ${addCmd(pm, "@docvia/plugin-shiki", true)}`;
		case "svelte":
			return `${addCmd(pm, "@docvia/renderer-svelte svelte")} && ${addCmd(pm, "@docvia/plugin-shiki", true)}`;
		case "none":
			return `${addCmd(pm, "@docvia/renderer-react")}   # or @docvia/renderer-svelte`;
	}
}
