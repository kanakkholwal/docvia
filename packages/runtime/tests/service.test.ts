import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompilerOptions, RendererAdapter } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CompileService } from "../src/service";

// The compile service never invokes the renderer (rendering happens in the
// framework adapters), but CompilerOptions requires one — a stub satisfies it.
const stubRenderer: RendererAdapter = {
	name: "stub",
	async renderPage() {
		return { slug: "", code: "", contentHash: "" };
	},
	async renderManifest() {
		return "";
	},
};

let projectRoot: string;

const FIXTURES: Record<string, string> = {
	"intro.md": "---\ntitle: Intro\n---\n\n# Intro\n\nWelcome to the docs.\n",
	"guide/setup.md":
		"---\ntitle: Setup\n---\n\n# Setup\n\nInstall and configure.\n",
};

beforeAll(async () => {
	projectRoot = await mkdtemp(join(tmpdir(), "docvia-runtime-"));
	for (const [rel, content] of Object.entries(FIXTURES)) {
		const full = join(projectRoot, "docs", rel);
		await mkdir(join(full, ".."), { recursive: true });
		await writeFile(full, content, "utf-8");
	}
});

afterAll(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

function options(outSubdir: string, incremental: boolean): CompilerOptions {
	return {
		sourceDir: "docs",
		outDir: join(projectRoot, outSubdir),
		renderer: stubRenderer,
		plugins: [],
		config: defineConfig({}),
		projectRoot,
		incremental,
	};
}

describe("CompileService.compileAll", () => {
	it("compiles every file in the source tree", async () => {
		const service = new CompileService(options(".out-all", false));
		const result = await service.compileAll();

		expect(result.stats.total).toBe(2);
		expect(result.stats.compiled).toBe(2);
		expect(result.stats.cached).toBe(0);
		expect(result.pages).toHaveLength(2);
		for (const page of result.pages) {
			expect(page.contentHash).toBeTruthy();
		}
	});

	it("getDocument returns IR whose contentHash matches the page", async () => {
		const service = new CompileService(options(".out-doc", false));
		const result = await service.compileAll();

		for (const page of result.pages) {
			const ir = await service.getDocument("docs", page.slug);
			expect(ir).toBeDefined();
			expect(ir?.contentHash).toBe(page.contentHash);
		}
	});

	it("is deterministic — two cold runs produce identical content hashes", async () => {
		const a = new CompileService(options(".out-det-a", false));
		const b = new CompileService(options(".out-det-b", false));
		const ra = await a.compileAll();
		const rb = await b.compileAll();

		const hashes = (pages: typeof ra.pages) =>
			Object.fromEntries(pages.map((p) => [p.slug, p.contentHash]));
		expect(hashes(ra.pages)).toEqual(hashes(rb.pages));
	});
});

describe("CompileService incremental cache", () => {
	it("reuses cached entries on a second run with no changes", async () => {
		const first = new CompileService(options(".out-incr", true));
		const firstResult = await first.compileAll();
		await first.emitDiskModuleGraph();
		expect(firstResult.stats.compiled).toBe(2);

		const second = new CompileService(options(".out-incr", true));
		const secondResult = await second.compileAll();

		expect(secondResult.stats.cached).toBe(2);
		expect(secondResult.stats.compiled).toBe(0);

		const hashes = (pages: typeof firstResult.pages) =>
			Object.fromEntries(pages.map((p) => [p.slug, p.contentHash]));
		expect(hashes(secondResult.pages)).toEqual(hashes(firstResult.pages));
	});
});

describe("CompileService.emitDiskModuleGraph", () => {
	it("writes the module-graph files", async () => {
		const outDir = join(projectRoot, ".out-emit");
		const service = new CompileService(options(".out-emit", false));
		await service.compileAll();
		await service.emitDiskModuleGraph();

		expect(existsSync(join(outDir, "source.ts"))).toBe(true);
		expect(existsSync(join(outDir, "dynamic.ts"))).toBe(true);
		expect(existsSync(join(outDir, "types.d.ts"))).toBe(true);
		expect(existsSync(join(projectRoot, "docvia-env.d.ts"))).toBe(true);
	});

	it("emits a per-route IR chunk and manifest for each document", async () => {
		const outDir = join(projectRoot, ".out-chunks");
		const service = new CompileService(options(".out-chunks", false));
		const result = await service.compileAll();
		await service.emitDiskModuleGraph();

		expect(existsSync(join(outDir, "ir", "manifest.json"))).toBe(true);
		for (const page of result.pages) {
			expect(existsSync(join(outDir, "ir", "docs", `${page.slug}.json`))).toBe(
				true,
			);
		}
	});
});

describe("CompileService.getVirtualSourceModule", () => {
	it("generates a self-contained docvia/source module", async () => {
		const service = new CompileService(options(".out-virtual", false));
		const result = await service.compileAll();

		const mod = service.getVirtualSourceModule();
		expect(mod).toContain("createSource");
		expect(mod).toContain("createCollection");
		expect(mod).toContain("?docvia");
		for (const page of result.pages) {
			expect(mod).toContain(JSON.stringify(page.slug));
		}
	});
});
