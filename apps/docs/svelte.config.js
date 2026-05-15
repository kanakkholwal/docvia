import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true,
	},
	kit: {
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
