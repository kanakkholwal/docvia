import { join } from "node:path";

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

	async setup({ dir, sh, pins, docvia }) {
		const createMs = await sh(
			`pnpm dlx sv@${pins.sv} create app --template minimal --types ts --no-add-ons --no-install`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		const installMs = await sh("pnpm install", { cwd: app });
		const docsMs = await sh(`node "${docvia.cli}" init --yes`, {
			cwd: app,
			env: { DOCVIA_TARBALLS: docvia.tarballs },
		});
		return { app, timings: { createMs, installMs, docsMs } };
	},

	dev: (port) => `pnpm exec vite dev --port ${port} --strictPort`,
	build: "pnpm build",
};
