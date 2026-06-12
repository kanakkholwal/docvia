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

describe("CompileService.invalidate", () => {
	// Each test gets its own isolated project so file mutations never leak.
	async function freshProject(files: Record<string, string>): Promise<string> {
		const dir = await mkdtemp(join(tmpdir(), "docvia-inv-"));
		for (const [rel, content] of Object.entries(files)) {
			const full = join(dir, "docs", rel);
			await mkdir(join(full, ".."), { recursive: true });
			await writeFile(full, content, "utf-8");
		}
		return dir;
	}

	function serviceFor(dir: string): CompileService {
		return new CompileService({
			sourceDir: "docs",
			outDir: join(dir, ".docvia"),
			renderer: stubRenderer,
			plugins: [],
			config: defineConfig({}),
			projectRoot: dir,
			incremental: false,
		});
	}

	it("recompiles a changed file without a route-map change", async () => {
		const dir = await freshProject({
			"a.md": "---\ntitle: A\n---\n\nOriginal body.\n",
		});
		const service = serviceFor(dir);
		const before = await service.compileAll();
		const beforeHash = before.pages[0]?.contentHash;

		await writeFile(
			join(dir, "docs", "a.md"),
			"---\ntitle: A\n---\n\nEdited body.\n",
			"utf-8",
		);
		const result = await service.invalidate([join(dir, "docs", "a.md")]);

		expect(result.routeMapChanged).toBe(false);
		expect(result.changed).toHaveLength(1);
		expect(result.changed[0]?.contentHash).not.toBe(beforeHash);

		await rm(dir, { recursive: true, force: true });
	});

	it("flags a route-map change for a newly added file", async () => {
		const dir = await freshProject({
			"a.md": "---\ntitle: A\n---\n\nA.\n",
		});
		const service = serviceFor(dir);
		await service.compileAll();

		await writeFile(
			join(dir, "docs", "new.md"),
			"---\ntitle: New\n---\n\nNew.\n",
			"utf-8",
		);
		const result = await service.invalidate([join(dir, "docs", "new.md")]);

		expect(result.routeMapChanged).toBe(true);
		expect(result.changed.some((c) => c.slug === "new")).toBe(true);

		await rm(dir, { recursive: true, force: true });
	});

	it("drops a deleted file and flags a route-map change", async () => {
		const dir = await freshProject({
			"a.md": "---\ntitle: A\n---\n\nA.\n",
			"b.md": "---\ntitle: B\n---\n\nB.\n",
		});
		const service = serviceFor(dir);
		await service.compileAll();

		await rm(join(dir, "docs", "b.md"));
		const result = await service.invalidate([join(dir, "docs", "b.md")]);

		expect(result.routeMapChanged).toBe(true);
		expect(service.getVirtualSourceModule()).not.toContain('"b"');

		await rm(dir, { recursive: true, force: true });
	});
});
