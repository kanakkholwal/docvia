import { defineConfig } from "@docvia/cli";
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

	// Syntax highlighting is a build-time plugin: `shiki()` highlights every
	// fenced code block during compilation and bakes the HTML into the IR, so
	// no highlighter ships to the browser or the Cloudflare Worker bundle.
	plugins: [
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
