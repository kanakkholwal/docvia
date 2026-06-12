import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true,
	},
	kit: {
		// `*` prerenders every page route to static HTML. The `/api/search`
		// endpoint opts out (`prerender = false`) so it runs dynamically in the
		// Worker — headless server-side search holds the index in memory there.
		prerender: {
			entries: ["*"],
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
