import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true,
	},
	kit: {
		// The search index endpoint is fetched client-side, so the prerender
		// crawler never discovers it on its own — list it explicitly. `*` keeps
		// every page route prerendered.
		prerender: {
			entries: ["*", "/search-index.json"],
		},
		// Cloudflare Workers adapter. Output lands in .svelte-kit/cloudflare/
		// and is shipped via wrangler.toml's `main` + `[assets]` config.
		adapter: adapter({
			// Enable platformProxy so local `vite dev` mirrors the Worker env.
			platformProxy: {
				configPath: "wrangler.toml",
				environment: undefined,
				persist: false,
			},
		}),
	},
};

export default config;
