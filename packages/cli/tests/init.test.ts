import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectProject, importSpecifier } from "../src/init/detect";
import {
	findTailwindCss,
	patchNextConfig,
	patchTailwindCss,
	patchViteConfig,
} from "../src/init/patch";
import { planFiles } from "../src/init/scaffold";

let root: string;

beforeEach(async () => {
	root = await mkdtemp(join(import.meta.dirname, "tmp-"));
});
afterEach(() => rm(root, { recursive: true, force: true }));

const write = async (file: string, text: string) => {
	await mkdir(join(root, file, ".."), { recursive: true });
	await writeFile(join(root, file), text);
};
const pkg = (extra: object) => write("package.json", JSON.stringify(extra));

describe("detectProject", () => {
	it("reads framework, package manager and aliases from the app", async () => {
		await pkg({ dependencies: { next: "16" } });
		await write("pnpm-lock.yaml", "");
		await write(
			"tsconfig.json",
			'{\n  // comment\n  "compilerOptions": { "paths": { "@/*": ["./*"], }, },\n}',
		);
		const project = detectProject(root);
		expect(project.framework).toBe("next");
		expect(project.pm).toBe("pnpm");
		expect(project.routesDir).toBe("app");
		expect(
			importSpecifier(
				project,
				join(root, "app/docs/page.tsx"),
				join(root, "lib/source"),
				".ts",
			),
		).toBe("@/lib/source");
	});

	it("uses package imports with an extension for SvelteKit", async () => {
		await pkg({
			devDependencies: { "@sveltejs/kit": "3" },
			imports: { "#lib/*": "./src/lib/*" },
		});
		const project = detectProject(root);
		expect(project.framework).toBe("sveltekit");
		expect(
			importSpecifier(
				project,
				join(root, "src/routes/docs/+page.ts"),
				join(root, "src/lib/source"),
				".ts",
			),
		).toBe("#lib/source.ts");
	});

	it("falls back to relative imports", async () => {
		await pkg({ dependencies: { "@tanstack/react-start": "1" } });
		const project = detectProject(root);
		expect(
			importSpecifier(
				project,
				join(root, "src/routes/docs/$.tsx"),
				join(root, "src/lib/source"),
				".ts",
			),
		).toBe("../../lib/source");
	});
});

describe("patchViteConfig", () => {
	it("adds docvia() first, matching indentation, quotes and semicolons", async () => {
		await write(
			"vite.config.ts",
			"import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [\n    react(),\n  ],\n})\n",
		);
		const { code } = patchViteConfig(join(root, "vite.config.ts"));
		expect(code).toContain("import { docvia } from '@docvia/build/vite'\n");
		expect(code).toContain("  plugins: [\n    docvia(),\n    react(),");
	});

	it("leaves a config that already uses docvia alone", async () => {
		await write(
			"vite.config.ts",
			'import { docvia } from "@docvia/build/vite";\nexport default { plugins: [docvia()] };\n',
		);
		expect(patchViteConfig(join(root, "vite.config.ts")).code).toBeUndefined();
	});

	it("explains a config it cannot patch", async () => {
		await write("vite.config.ts", "export default {};\n");
		expect(() => patchViteConfig(join(root, "vite.config.ts"))).toThrow(
			/plugins/,
		);
	});
});

describe("patchNextConfig", () => {
	it("wraps an ESM default export", async () => {
		await write(
			"next.config.ts",
			'import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n',
		);
		const { code } = patchNextConfig(join(root, "next.config.ts"));
		expect(code).toContain('import { withDocvia } from "@docvia/build/next";');
		expect(code).toContain("export default withDocvia()(nextConfig);");
	});

	it("wraps module.exports", async () => {
		await write(
			"next.config.js",
			"module.exports = { reactStrictMode: true };\n",
		);
		const { code } = patchNextConfig(join(root, "next.config.js"));
		expect(code).toContain(
			'const { withDocvia } = require("@docvia/build/next");',
		);
		expect(code).toContain(
			"module.exports = withDocvia()({ reactStrictMode: true });",
		);
	});
});

describe("planFiles", () => {
	it("places Next files under src/ when the app uses src/app", async () => {
		await pkg({ dependencies: { next: "16" } });
		await mkdir(join(root, "src", "app"), { recursive: true });
		const paths = planFiles(detectProject(root)).map((f) =>
			f.path
				.slice(root.length + 1)
				.split("\\")
				.join("/"),
		);
		expect(paths).toContain("src/lib/source.ts");
		expect(paths).toContain("src/app/docs/[[...slug]]/page.tsx");
		expect(paths).toContain("content/docs/index.md");
	});

	it("resolves template imports and keeps the router-ignored CSS name", async () => {
		await pkg({ dependencies: { "@tanstack/react-start": "1" } });
		const files = planFiles(detectProject(root));
		const route = files.find((f) => f.path.endsWith("route.tsx"));
		expect(route?.content).toContain('from "../../lib/source"');
		expect(route?.content).not.toContain("~lib");
		expect(files.some((f) => f.path.endsWith("-docs.css"))).toBe(true);
	});
});

describe("patchTailwindCss", () => {
	it("excludes the content directory from Tailwind's scan", async () => {
		await write(
			"app/globals.css",
			'@import "tailwindcss";\n\n:root { color: red; }\n',
		);
		const css = findTailwindCss(root, ["app", "src"]);
		expect(css).toBe(join(root, "app", "globals.css"));
		const { code } = patchTailwindCss(css as string, join(root, "content"));
		expect(code).toBe(
			'@import "tailwindcss";\n@source not "../content";\n\n:root { color: red; }\n',
		);
	});

	it("ignores stylesheets without Tailwind v4", async () => {
		await write("src/app.css", "body { margin: 0; }\n");
		expect(findTailwindCss(root, ["src"])).toBeUndefined();
	});
});
