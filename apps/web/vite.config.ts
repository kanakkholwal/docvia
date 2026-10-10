import { readFileSync } from "node:fs";
import { docvia } from "@docvia/build/vite";
import { openapiModule } from "@docvia/plugin-openapi/vite";
import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { highlight, highlightedSnippets } from "./vite-plugin-snippets.ts";

// Baked in at build time so prerendered HTML and the client agree on the version.
const cliVersion: string = JSON.parse(
	readFileSync(
		new URL("../../packages/cli/package.json", import.meta.url),
		"utf8",
	),
).version;

export default defineConfig({
	define: {
		__DOCVIA_VERSION__: JSON.stringify(cliVersion),
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			compilerOptions: { runes: true },
			adapter: adapter({
				platformProxy: { configPath: "wrangler.toml", persist: false },
			}),
		}),
		// Loads ./docvia.config.ts.
		docvia(),
		highlightedSnippets(),
		// The sample spec behind /docs/api-example, resolved and highlighted at build time.
		openapiModule({ spec: "src/api/petstore.yaml", highlight }),
	],
});
