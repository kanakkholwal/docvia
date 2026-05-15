import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		docviaSourcePlugin(),
		docviaMarkdownPlugin(docviaConfig),
	],
	build: {
		rollupOptions: {
			external: ["@docvia/source", "@docvia/source/internal"],
		},
	},
	ssr: {
		resolve: {
			// The SSR bundle ships to a Cloudflare Worker (workerd), not Node.
			// Without this, transitive CJS deps (e.g. `yaml`, pulled in via
			// @docvia/schema) resolve their `node` export — CJS — and Rollup
			// emits a `createRequire(import.meta.url)` interop shim that
			// crashes the Worker at startup ("path must be ... Received
			// 'undefined'"). Dropping `node` makes them resolve their ESM
			// (`default`) build instead, so no shim is generated.
			//
			// NB: `browser` is intentionally NOT included — it would make
			// SvelteKit resolve its *client* runtime (top-level `window.fetch`)
			// into the server bundle and crash SSR/prerender.
			conditions: ["workerd", "worker", "module", "import", "default"],
		},
	},
});
