import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { docviaConfig, RendererAdapter } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { docvia } from "../src/plugin";

// Renders an IR document to a trivial JS module — enough to exercise the
// plugin's transform without pulling in a real framework renderer.
const stubRenderer: RendererAdapter = {
	name: "stub",
	async renderPage(doc) {
		return {
			slug: doc.slug,
			code: `export const slug = ${JSON.stringify(doc.slug)};`,
			contentHash: doc.contentHash,
		};
	},
	async renderManifest() {
		return "";
	},
};

let projectRoot: string;
let config: docviaConfig;

beforeAll(async () => {
	projectRoot = await mkdtemp(join(tmpdir(), "docvia-vite-"));
	await mkdir(join(projectRoot, "docs"), { recursive: true });
	await writeFile(
		join(projectRoot, "docs", "intro.md"),
		"---\ntitle: Intro\n---\n\n# Intro\n\nHello Vite.\n",
		"utf-8",
	);
	config = defineConfig({
		sourceDir: "docs",
		outDir: ".docvia",
		collections: [{ name: "docs", sourceDir: "docs", baseUrl: "/" }],
		renderer: stubRenderer,
	});
});

afterAll(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

// The plugin hooks are plain methods — call them directly. Vite would
// normalise these at runtime; the cast just satisfies the union types.
type Hooks = {
	configResolved(c: { root: string; command: string }): void;
	buildStart(): Promise<void>;
	resolveId(id: string): string | null;
	load(id: string): string | null;
	transform(
		code: string,
		id: string,
	): Promise<{ code: string } | null> | { code: string } | null;
};

describe("docvia() Vite plugin", () => {
	it("serves virtual:docvia/source as a virtual module in dev", async () => {
		const plugin = docvia(config) as unknown as Hooks;
		plugin.configResolved({ root: projectRoot, command: "serve" });
		await plugin.buildStart();

		const resolved = plugin.resolveId("virtual:docvia/source");
		expect(resolved).toBe("\0virtual:docvia/source");

		const mod = plugin.load(resolved as string);
		expect(typeof mod).toBe("string");
		expect(mod).toContain("createSource");
		expect(mod).toContain("createCollection");
		expect(mod).toContain('"intro"');
	});

	it("serves virtual:docvia/source from the load hook in build too", async () => {
		// No on-disk source.ts wrapper for Vite — the virtual module is served
		// the same way in build as in dev.
		const plugin = docvia(config) as unknown as Hooks;
		plugin.configResolved({ root: projectRoot, command: "build" });
		await plugin.buildStart();

		const resolved = plugin.resolveId("virtual:docvia/source");
		expect(resolved).toBe("\0virtual:docvia/source");

		const mod = plugin.load(resolved as string);
		expect(typeof mod).toBe("string");
		expect(mod).toContain("createSource");
	});

	it("transforms .md?docvia ids and ignores everything else", async () => {
		const plugin = docvia(config) as unknown as Hooks;
		plugin.configResolved({ root: projectRoot, command: "serve" });
		await plugin.buildStart();

		expect(await plugin.transform("const x = 1;", "/app/main.js")).toBeNull();

		const mdId = `${join(projectRoot, "docs", "intro.md")}?docvia`;
		const out = await plugin.transform("# Intro\n", mdId);
		expect(out).not.toBeNull();
		expect(typeof out?.code).toBe("string");
	});

	it("throws when the config has no renderer", () => {
		const noRenderer = defineConfig({ sourceDir: "docs", outDir: ".docvia" });
		expect(() => docvia(noRenderer)).toThrow(/renderer/i);
	});
});
