import { docvia } from "@docvia/plugin-vite";
import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: { runes: true },
			// Deployed to svelte-demo.docvia.dev via .github/workflows/deploy-demo-svelte.yml.
			adapter: adapter({
				platformProxy: { configPath: "wrangler.toml", persist: false },
			}),
		}),
		// Loads ./docvia.config.ts.
		docvia(),
	],
});
