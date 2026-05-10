#!/usr/bin/env node
// Seeds a minimal README.md into every public package that is missing one.
// One-shot script — safe to re-run; existing READMEs are skipped.

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, "..", "packages");

// One-line role for each package — keeps READMEs short but accurate.
const usage = {
	"@docvia/cli": {
		install: "pnpm add -D @docvia/cli",
		example: "$ docvia init\n$ docvia build\n$ docvia dev",
	},
	"@docvia/compiler": {
		install: "pnpm add @docvia/compiler",
		example:
			'import { compile } from "@docvia/compiler";\n\nawait compile({\n  sourceDir: "docs",\n  outDir: ".docvia",\n  renderer,\n  plugins: [],\n  config,\n});',
	},
	"@docvia/core": {
		install: "pnpm add @docvia/core",
		example:
			'import { parseMarkdown } from "@docvia/core";\n\nconst { ast } = await parseMarkdown(md, { remarkPlugins: [] });',
	},
	"@docvia/ir": {
		install: "pnpm add @docvia/ir",
		example:
			'import { transformToIR, docviaError } from "@docvia/ir";\n\nconst irDoc = transformToIR(ast, frontmatter, "page.md");',
	},
	"@docvia/plugins": {
		install: "pnpm add @docvia/plugins",
		example:
			'import { defineConfig, loadConfig, PluginRunner } from "@docvia/plugins";\n\nconst config = defineConfig({ sourceDir: "docs", outDir: ".docvia" });',
	},
	"@docvia/renderer-core": {
		install: "pnpm add @docvia/renderer-core",
		example:
			'import { renderDocument, createDefaultRendererMap } from "@docvia/renderer-core";\n\nconst result = await renderDocument(doc, createDefaultRendererMap(), ctx);',
	},
	"@docvia/renderer-react": {
		install: "pnpm add @docvia/renderer-react react react-dom",
		example:
			'import { createReactRenderer, createShikiHighlighter } from "@docvia/renderer-react";\n\nconst renderer = createReactRenderer({\n  highlighter: createShikiHighlighter({ theme: "github-dark" }),\n});',
	},
	"@docvia/renderer-svelte": {
		install: "pnpm add @docvia/renderer-svelte svelte",
		example:
			'import { createSvelteRenderer, createShikiHighlighter } from "@docvia/renderer-svelte/node";\n\nconst renderer = createSvelteRenderer({\n  highlighter: createShikiHighlighter({ theme: "github-dark" }),\n});',
	},
	"@docvia/schema": {
		install: "pnpm add @docvia/schema",
		example:
			'import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";\n\nconst { data, content } = extractFrontmatter(raw);\nconst frontmatter = validateFrontmatter(data);',
	},
	"@docvia/search": {
		install: "pnpm add @docvia/search",
		example:
			'import { createSearchIndexer, createSearch } from "@docvia/search";\n\nconst indexer = createSearchIndexer();\nawait indexer.buildIndex(pages);\nconst { search } = createSearch(indexer.exportIndex());',
	},
	"@docvia/source": {
		install: "pnpm add @docvia/source",
		example:
			'import { docviaSource } from "docvia/source"; // generated\n\nconst page = await docviaSource.docs.get("getting-started");',
	},
	"@docvia/plugin-vite": {
		install: "pnpm add -D @docvia/plugin-vite",
		example:
			'import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";\nimport docviaConfig from "./docvia.config";\n\nexport default {\n  plugins: [docviaSourcePlugin(), docviaMarkdownPlugin(docviaConfig)],\n};',
	},
	"@docvia/plugin-next": {
		install: "pnpm add -D @docvia/plugin-next",
		example:
			'import { withDocvia } from "@docvia/plugin-next";\n\nexport default withDocvia()({\n  /* your next.config */\n});',
	},
};

function template(pkg, snippet) {
	const desc = pkg.description ?? "";
	return `# ${pkg.name}

${desc}

Part of [docvia](https://github.com/kanakkholwal/docvia) — a build-time
documentation compiler for React, Svelte, and any framework with a renderer
adapter.

## Install

\`\`\`bash
${snippet.install}
\`\`\`

## Usage

\`\`\`ts
${snippet.example}
\`\`\`

## Documentation

See the [main README](https://github.com/kanakkholwal/docvia#readme) for the
full architecture overview, configuration reference, and examples.

## Licence

MIT
`;
}

const dirs = await readdir(packagesDir, { withFileTypes: true });
let added = 0;
let skipped = 0;
for (const ent of dirs) {
	if (!ent.isDirectory()) continue;
	const pkgDir = join(packagesDir, ent.name);
	const pkgPath = join(pkgDir, "package.json");
	if (!existsSync(pkgPath)) continue;
	const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
	if (pkg.private) continue;

	const readmePath = join(pkgDir, "README.md");
	if (existsSync(readmePath)) {
		console.log(`✓ ${pkg.name} (already has README)`);
		skipped++;
		continue;
	}

	const snippet = usage[pkg.name];
	if (!snippet) {
		console.warn(`! ${pkg.name} (no template snippet — skipping)`);
		continue;
	}

	await writeFile(readmePath, template(pkg, snippet), "utf-8");
	console.log(`+ ${pkg.name}`);
	added++;
}

console.log(`\nAdded ${added}, skipped ${skipped}.`);
