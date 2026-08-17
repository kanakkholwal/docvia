import { defineConfig } from "@docvia/cli";
import { mermaid } from "@docvia/plugin-mermaid";
import { shiki } from "@docvia/plugin-shiki";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
	sourceDir: "src/docs",
	outDir: ".docvia",
	collections: [
		{
			name: "docs",
			sourceDir: "src/docs",
			baseUrl: "/docs",
		},
	],

	renderer: createSvelteRenderer(),

	// Both plugins run at compile time. `mermaid()` claims ```mermaid fences
	// first (phase "pre") and turns them into component nodes; `shiki()` then
	// bakes highlighted HTML into every remaining code block, so no highlighter
	// ships to the browser or the Cloudflare Worker bundle.
	plugins: [
		mermaid(),
		shiki({
			theme: "github-dark",
			langs: [
				"javascript",
				"typescript",
				"tsx",
				"svelte",
				"html",
				"css",
				"bash",
				"json",
				"jsonc",
				"yaml",
				"markdown",
			],
		}),
	],
});
