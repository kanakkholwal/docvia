import { mermaid } from "@docvia/plugin-mermaid";
import { shiki } from "@docvia/plugin-shiki";
import { defineConfig } from "@docvia/plugin-vite";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
	renderer: createSvelteRenderer(),

	// Both plugins run at compile time. `mermaid()` claims ```mermaid fences
	// first (phase "pre") and turns them into component nodes; `shiki()` then
	// bakes highlighted HTML into every remaining code block, so no highlighter
	// ships to the browser or the Cloudflare Worker bundle.
	plugins: [
		mermaid(),
		shiki({
			themes: { light: "github-light", dark: "github-dark" },
			defaultColor: false,
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
