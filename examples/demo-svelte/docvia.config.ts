import { defineConfig } from "@docvia/cli";
import { shiki } from "@docvia/plugin-shiki";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
	sourceDir: "src/docs",
	outDir: ".docvia",
	collections: [{ name: "docs", sourceDir: "src/docs", baseUrl: "/docs" }],

	// Register your components here — once. docvia will generate the runtime
	// registry automatically so you don't need to repeat this in +page.svelte.
	components: {
		counter: {
			path: "./src/lib/components/Counter.svelte",
			hydrate: true,
			defaultProps: {
				initial: 0,
			},
		},
	},

	renderer: createSvelteRenderer(),

	// Syntax highlighting is a build-time plugin: it highlights every code block
	// during compilation and bakes the HTML into the IR, so no highlighter ships
	// to the browser.
	plugins: [
		shiki({
			// Set your preferred Shiki theme (default is 'github-dark').
			theme: "dracula",

			// Register languages you want to highlight.
			langs: [
				"javascript",
				"typescript",
				"svelte",
				"html",
				"css",
				"bash",
				"json",
			],
		}),
	],
});
