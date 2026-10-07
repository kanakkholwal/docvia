import { join } from "node:path";
import { installApproved } from "../lib/setup.mjs";
import { openNext } from "./targets.mjs";

/**
 * A fumadocs starter from `create-fumadocs-app`, kept on its defaults (search, OG images and
 * llms.txt routes included), with the corpus written as `.mdx` as the starters expect.
 * @returns {import("./types.mjs").Stack}
 */
function fumadocs({ id, template, framework, docsPath = "/docs", ...rest }) {
	return {
		id: `fumadocs-${id}`,
		label: `fumadocs (${framework})`,
		tool: "fumadocs",
		framework,
		workers: "ssr",
		contentDir: "content/docs",
		contentExt: ".mdx",
		docsPath,
		...rest,

		async setup({ dir, sh, capture, pins }) {
			// The create CLI installs dependencies itself, so its time includes the install.
			const createMs = await sh(
				`pnpm dlx create-fumadocs-app@${pins["create-fumadocs-app"]} app --template ${template} --pm pnpm --install --no-git --yes`,
				{ cwd: dir, env: { CI: "1" } },
			);
			const app = join(dir, "app");
			return {
				app,
				timings: { createMs, ...(await installApproved(capture, app)) },
			};
		},
	};
}

const vite = (port) => `pnpm exec vite dev --port ${port} --strictPort`;
const vitePreview = (port) =>
	`pnpm exec vite preview --port ${port} --strictPort`;

export const fumadocsNext = fumadocs({
	id: "next",
	template: "+next+fuma-docs-mdx",
	framework: "Next.js",
	caches: [".next", ".source"],
	clientDir: ".next/static",
	versionsOf: ["next", "react", "fumadocs-core", "fumadocs-mdx"],
	dev: (port) => `pnpm exec next dev --port ${port}`,
	build: "pnpm build",
	preview: (port) => `pnpm exec next start --port ${port}`,
	workersTarget: openNext,
});

export const fumadocsTanStackStart = fumadocs({
	id: "tanstack-start",
	template: "tanstack-start",
	framework: "TanStack Start",
	caches: [
		".output",
		".vercel",
		".nitro",
		".tanstack",
		".source",
		"dist",
		"node_modules/.vite",
	],
	clientDir: ".vercel/output/static",
	versionsOf: [
		"@tanstack/react-start",
		"react",
		"fumadocs-core",
		"fumadocs-mdx",
	],
	dev: vite,
	build: "pnpm build",
	preview: vitePreview,
	workersTarget: {
		unsupported:
			"the starter hardcodes Nitro's Vercel preset in vite.config.ts",
	},
});

export const fumadocsReactRouter = fumadocs({
	id: "react-router",
	template: "react-router",
	platformIssues: {
		win32:
			"the starter's prerender list builds URLs with Windows backslashes, so its build 404s; measured on Linux",
	},
	framework: "React Router",
	caches: ["build", ".react-router", ".source", "node_modules/.vite"],
	clientDir: "build/client",
	versionsOf: ["react-router", "react", "fumadocs-core", "fumadocs-mdx"],
	dev: (port) => `pnpm exec react-router dev --port ${port} --strictPort`,
	build: "pnpm build",
	preview: (port) => ({
		cmd: "pnpm exec react-router-serve ./build/server/index.js",
		env: { PORT: String(port) },
	}),
	workersTarget: {
		unsupported: "no CLI command switches the starter to a Cloudflare build",
	},
});

export const fumadocsWaku = fumadocs({
	id: "waku",
	template: "waku",
	framework: "Waku",
	caches: ["dist", ".source", "node_modules/.vite"],
	clientDir: "dist/public",
	versionsOf: ["waku", "react", "fumadocs-core", "fumadocs-mdx"],
	dev: (port) => `pnpm exec waku dev --port ${port}`,
	build: "pnpm build",
	preview: (port) => `pnpm exec waku start --port ${port}`,
	workersTarget: { unsupported: "the Waku CLI has no Cloudflare build target" },
});

export const fumadocsAstro = fumadocs({
	id: "astro",
	template: "astro",
	framework: "Astro",
	docsPath: "",
	caches: ["dist", ".astro", "node_modules/.vite"],
	clientDir: "dist",
	versionsOf: ["astro", "react", "fumadocs-core"],
	dev: (port) => `pnpm exec astro dev --port ${port}`,
	build: "pnpm build",
	preview: (port) => `pnpm exec astro preview --port ${port}`,
	workersTarget: {
		async setup({ app, sh }) {
			await sh("pnpm exec astro add cloudflare --yes", { cwd: app });
		},
		build: "pnpm build",
	},
});
