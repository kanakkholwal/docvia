import { defineConfig } from "@docvia/cli";
import {
	createShikiHighlighter,
	createSvelteRenderer,
} from "@docvia/renderer-svelte/node";

export default defineConfig({
	sourceDir: "src/docs",
	outDir: ".docvia",
	collections: [
		{
			name: "docs",
			sourceDir: "src/docs",
			baseUrl: "/"
		}
	],

	renderer: createSvelteRenderer({
		highlighter: createShikiHighlighter({
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
	}),
});
