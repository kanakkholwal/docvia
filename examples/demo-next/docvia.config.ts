import { defineConfig } from "@docvia/build/next";
import { createReactRenderer } from "@docvia/core/react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
	// Register components here — the compiler generates the runtime registry
	// so individual pages don't need to import them manually.
	components: {
		counter: {
			path: "./components/Counter",
			hydrate: true,
			defaultProps: {
				initial: 0,
			},
		},
		greeting: {
			path: "./components/Greeting",
			hydrate: true,
		},
	},

	renderer: createReactRenderer(),

	// Syntax highlighting is a build-time plugin: it highlights every code block
	// during compilation and bakes the HTML into the IR, so no highlighter ships
	// to the browser.
	plugins: [
		shiki({
			theme: "github-dark",
			langs: [
				"javascript",
				"typescript",
				"tsx",
				"jsx",
				"bash",
				"json",
				"css",
				"html",
			],
		}),
	],
});
