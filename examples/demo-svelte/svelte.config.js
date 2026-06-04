import adapter from "@sveltejs/adapter-cloudflare";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project
		runes: true,
	},
	kit: {
		// `*` seeds the prerender crawler from every static route; the
		// [...slug] rest route is enumerated by its own `entries` generator.
		prerender: {
			entries: ["*"],
		},
		// Cloudflare Workers adapter. Output lands in .svelte-kit/cloudflare/
		// and is shipped via wrangler.toml's `main` + `[assets]` config.
		// Deployed to svelte-demo.docvia.dev — see
		// .github/workflows/deploy-demo-svelte.yml.
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
