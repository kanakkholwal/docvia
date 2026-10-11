import { join } from "node:path";
import { addDocs } from "../lib/docvia.mjs";
import { nitroCloudflare } from "./targets.mjs";

/** @type {import("./types.mjs").Stack} */
export default {
	id: "docvia-tanstack-start",
	label: "docvia (TanStack Start)",
	tool: "docvia",
	framework: "TanStack Start",
	workers: "ssr",
	requiresDocvia: true,
	contentDir: "content/docs",
	docsPath: "/docs",
	caches: [".output", ".nitro", ".tanstack", "dist", "node_modules/.vite"],
	clientDir: ".output/public",
	versionsOf: ["@tanstack/react-start", "react", "vite", "@docvia/build/vite"],

	async setup({ dir, sh, pins, docvia, log }) {
		// The create CLI installs dependencies itself, so its time includes the install.
		const createMs = await sh(
			`pnpm create @tanstack/start@${pins["@tanstack/create-start"]} app --yes --no-git --no-intent --package-manager pnpm`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		const init = await addDocs(app, docvia, log);
		return { app, timings: { createMs, ...init } };
	},

	dev: (port) => `pnpm exec vite dev --port ${port} --strictPort`,
	build: "pnpm build",
	workersTarget: nitroCloudflare("pnpm build"),
	preview: (port) => `pnpm exec vite preview --port ${port} --strictPort`,
};
