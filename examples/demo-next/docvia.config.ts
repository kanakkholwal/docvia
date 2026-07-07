import { defineConfig } from "@docvia/cli";
import { shiki } from "@docvia/plugin-shiki";
import { createReactRenderer } from "@docvia/renderer-react";
import { z } from "zod/v3";

export default defineConfig({
	// Extend built-in frontmatter fields with app-specific ones. Accepts any
	// Standard Schema (https://standardschema.dev) library — Zod, Valibot,
	// ArkType, etc. The compiler layers this on top of the base schema (title,
	// description, tags…), validates every page at build time, and — for
	// introspectable Zod schemas — emits a typed Frontmatter interface instead
	// of the default union-of-literal-values.
	frontmatter: z.object({
		author: z.string().optional(),
		order: z.number().optional(),
	}),

	sourceDir: "docs",
	outDir: ".docvia",
	collections: [{ name: "docs", sourceDir: "docs", baseUrl: "/docs" }],

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
