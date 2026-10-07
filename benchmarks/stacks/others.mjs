import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { installApproved } from "../lib/setup.mjs";
import { nitroCloudflare } from "./targets.mjs";

// Corpus goes in a `bench` folder where a starter links to its own sample pages: removing them
// would turn those links into broken-link build errors that have nothing to do with speed.

/** @type {import("./types.mjs").Stack} */
export const sveltepress = {
	id: "sveltepress",
	label: "SveltePress",
	tool: "SveltePress",
	framework: "SvelteKit",
	workers: "static",
	contentDir: "src/routes/docs",
	contentLayout: "routes",
	docsPath: "/docs",
	caches: [".svelte-kit", "dist", "node_modules/.vite"],
	clientDir: "dist",
	versionsOf: [
		"@sveltepress/vite",
		"@sveltepress/theme-default",
		"@sveltejs/kit",
	],
	knownIssue:
		"the starter's own build fails: @sveltepress/theme-default components cannot load their styles on the current SvelteKit 3 toolchain",
	async setup({ dir, sh, capture, pins }) {
		const createMs = await sh(
			`pnpm create @sveltepress@${pins["@sveltepress/create"]} app --template ts`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		return {
			app,
			timings: { createMs, ...(await installApproved(capture, app)) },
		};
	},
	dev: (port) => `pnpm exec vite dev --port ${port} --strictPort`,
	build: "pnpm build",
	preview: (port) => `pnpm exec vite preview --port ${port} --strictPort`,
};

/** @type {import("./types.mjs").Stack} */
export const starlight = {
	id: "starlight",
	label: "Starlight",
	tool: "Starlight",
	framework: "Astro",
	workers: "static",
	contentDir: "src/content/docs/bench",
	docsPath: "/bench",
	caches: ["dist", ".astro", "node_modules/.vite"],
	clientDir: "dist",
	versionsOf: ["@astrojs/starlight", "astro"],
	async setup({ dir, sh, capture, pins }) {
		const createMs = await sh(
			`pnpm create astro@${pins["create-astro"]} app --template starlight --install --no-git --yes --skip-houston --no-ai`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		return {
			app,
			timings: { createMs, ...(await installApproved(capture, app)) },
		};
	},
	dev: (port) => `pnpm exec astro dev --port ${port}`,
	build: "pnpm build",
	preview: (port) => `pnpm exec astro preview --port ${port}`,
};

/** @type {import("./types.mjs").Stack} */
export const docusaurus = {
	id: "docusaurus",
	devRendering: "client",
	label: "Docusaurus",
	tool: "Docusaurus",
	framework: "React",
	workers: "static",
	contentDir: "docs/bench",
	docsPath: "/docs/bench",
	caches: ["build", ".docusaurus", "node_modules/.cache"],
	clientDir: "build",
	versionsOf: ["@docusaurus/core", "react"],
	async setup({ dir, sh, capture, pins }) {
		const createMs = await sh(
			`pnpm dlx create-docusaurus@${pins["create-docusaurus"]} app classic --typescript --package-manager pnpm`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		return {
			app,
			timings: { createMs, ...(await installApproved(capture, app)) },
		};
	},
	dev: (port) => `pnpm exec docusaurus start --port ${port} --no-open`,
	build: "pnpm build",
	preview: (port) => `pnpm exec docusaurus serve --port ${port} --no-open`,
};

/** @type {import("./types.mjs").Stack} */
export const rspress = {
	id: "rspress",
	devRendering: "client",
	label: "Rspress",
	tool: "Rspress",
	framework: "Rsbuild",
	workers: "static",
	contentDir: "docs/bench",
	docsPath: "/bench",
	caches: ["doc_build", "node_modules/.rspress"],
	clientDir: "doc_build",
	versionsOf: ["@rspress/core"],
	async setup({ dir, sh, capture, pins }) {
		const createMs = await sh(
			`pnpm dlx create-rspress@${pins["create-rspress"]} --dir app --template basic --no-git`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		return {
			app,
			timings: { createMs, ...(await installApproved(capture, app)) },
		};
	},
	dev: (port) => `pnpm exec rspress dev --port ${port}`,
	build: "pnpm exec rspress build",
	preview: (port) => `pnpm exec rspress preview --port ${port}`,
};

/** @type {import("./types.mjs").Stack} */
export const docus = {
	id: "docus",
	label: "Docus",
	tool: "Docus",
	framework: "Nuxt",
	workers: "ssr",
	contentDir: "content/bench",
	docsPath: "/bench",
	caches: [".nuxt", ".output", ".data"],
	clientDir: ".output/public",
	versionsOf: ["docus", "nuxt"],
	// `create-docus` wraps `nuxi init` without passing flags through, so it cannot run
	// non-interactively; this is the same starter it downloads.
	async setup({ dir, sh, capture, pins }) {
		const createMs = await sh(
			`pnpm dlx nuxi@${pins.nuxi} init app --template=gh:nuxt-content/docus/.starters/default --packageManager=pnpm --gitInit=false --no-install`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		return {
			app,
			timings: { createMs, ...(await installApproved(capture, app)) },
		};
	},
	dev: (port) => `pnpm exec nuxt dev --port ${port}`,
	build: "pnpm exec nuxt build",
	workersTarget: nitroCloudflare("pnpm exec nuxt build"),
	preview: (port) => ({
		cmd: "node .output/server/index.mjs",
		env: { PORT: String(port) },
	}),
};

/**
 * VitePress needs no config, and its `init` wizard has no non-interactive mode, so this is the
 * minimal setup its guide documents: install the package and point it at a folder of pages.
 * @type {import("./types.mjs").Stack}
 */
export const vitepress = {
	id: "vitepress",
	devRendering: "client",
	label: "VitePress",
	tool: "VitePress",
	framework: "Vite",
	workers: "static",
	contentDir: "docs/docs",
	docsPath: "/docs",
	caches: ["docs/.vitepress/dist", "docs/.vitepress/cache"],
	clientDir: "docs/.vitepress/dist",
	versionsOf: ["vitepress", "vue"],
	async setup({ dir, sh, capture, pins }) {
		const app = join(dir, "app");
		mkdirSync(app, { recursive: true });
		const createMs = await sh("pnpm init", { cwd: app });
		const install = await installApproved(
			capture,
			app,
			`pnpm add -D vitepress@${pins.vitepress} vue`,
		);
		return { app, timings: { createMs, ...install } };
	},
	dev: (port) => `pnpm exec vitepress dev docs --port ${port} --strictPort`,
	build: "pnpm exec vitepress build docs",
	preview: (port) => `pnpm exec vitepress preview docs --port ${port}`,
};
