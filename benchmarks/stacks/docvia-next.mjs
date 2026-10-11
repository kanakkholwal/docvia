import { join } from "node:path";
import { addDocs } from "../lib/docvia.mjs";
import { openNext } from "./targets.mjs";

/** @type {import("./types.mjs").Stack} */
export default {
	id: "docvia-next",
	label: "docvia (Next.js)",
	tool: "docvia",
	framework: "Next.js",
	workers: "ssr",
	requiresDocvia: true,
	contentDir: "content/docs",
	docsPath: "/docs",
	caches: [".next"],
	clientDir: ".next/static",
	versionsOf: ["next", "react", "@docvia/build/next"],

	async setup({ dir, sh, pins, docvia, log }) {
		const createMs = await sh(
			`pnpm create next-app@${pins["create-next-app"]} app --yes --use-pnpm --disable-git --skip-install`,
			{ cwd: dir, env: { CI: "1" } },
		);
		const app = join(dir, "app");
		const installMs = await sh("pnpm install", { cwd: app });
		const init = await addDocs(app, docvia, log);
		return { app, timings: { createMs, installMs, ...init } };
	},

	dev: (port) => `pnpm exec next dev --port ${port}`,
	build: "pnpm build",
	workersTarget: openNext,
	preview: (port) => `pnpm exec next start --port ${port}`,
};
