import { join } from "node:path";
import { addDocs } from "../lib/docvia.mjs";

/** @type {import("./types.mjs").Stack} */
export default {
	id: "docvia-sveltekit",
	label: "docvia (SvelteKit)",
	tool: "docvia",
	framework: "SvelteKit",
	workers: "ssr",
	requiresDocvia: true,
	contentDir: "content/docs",
	docsPath: "/docs",
	caches: [".svelte-kit", "node_modules/.vite"],
	clientDir: ".svelte-kit/output/client",
	versionsOf: ["@sveltejs/kit", "svelte", "vite", "@docvia/plugin-vite"],

	async setup({ dir, sh, pins, docvia, log }) {
		const createMs = await sh(
			`pnpm dlx sv@${pins.sv} create app --template minimal --types ts --no-add-ons --no-install`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		const installMs = await sh("pnpm install", { cwd: app });
		const init = await addDocs(app, docvia, log);
		return { app, timings: { createMs, installMs, ...init } };
	},

	dev: (port) => `pnpm exec vite dev --port ${port} --strictPort`,
	build: "pnpm build",
	workersTarget: {
		async setup({ app, sh, pins }) {
			await sh(
				`pnpm dlx sv@${pins.sv} add "sveltekit-adapter=adapter:cloudflare+cfTarget:workers" --install pnpm --no-git-check`,
				{ cwd: app },
			);
			// The adapter's build checks generated binding types; generating them is its next step.
			await sh("pnpm exec wrangler types", { cwd: app });
		},
		build: "pnpm build",
	},
	preview: (port) => `pnpm exec vite preview --port ${port} --strictPort`,
};
