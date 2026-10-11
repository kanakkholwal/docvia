import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompilerOptions, RendererAdapter } from "@docvia/core";
import { toPageMeta } from "@docvia/core";
import { defineConfig } from "@docvia/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateVirtualSource } from "../src/emit";
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

function options(outSubdir: string): CompilerOptions {
	return {
		sourceDir: "docs",
		outDir: join(projectRoot, outSubdir),
		renderer: stubRenderer,
		plugins: [],
		config: defineConfig({}),
		projectRoot,
	};
}

describe("CompileService.compileAll", () => {
	it("compiles every file in the source tree", async () => {
		const service = new CompileService(options(".out-all"));
		const result = await service.compileAll();

		expect(result.stats.total).toBe(2);
		expect(result.stats.compiled).toBe(2);
		expect(result.pages).toHaveLength(2);
		for (const page of result.pages) {
			expect(page.contentHash).toBeTruthy();
		}
	});

	it("getDocument returns IR whose contentHash matches the page", async () => {
		const service = new CompileService(options(".out-doc"));
		const result = await service.compileAll();

		for (const page of result.pages) {
			const ir = await service.getDocument("docs", page.slug);
			expect(ir).toBeDefined();
			expect(ir?.contentHash).toBe(page.contentHash);
		}
	});

	it("is deterministic — two cold runs produce identical content hashes", async () => {
		const a = new CompileService(options(".out-det-a"));
		const b = new CompileService(options(".out-det-b"));
		const ra = await a.compileAll();
		const rb = await b.compileAll();

		const hashes = (pages: typeof ra.pages) =>
			Object.fromEntries(pages.map((p) => [p.slug, p.contentHash]));
		expect(hashes(ra.pages)).toEqual(hashes(rb.pages));
	});
});

describe("CompileService.emitDiskModuleGraph", () => {
	it("writes the module-graph files", async () => {
		const outDir = join(projectRoot, ".out-emit");
		const service = new CompileService(options(".out-emit"));
		await service.compileAll();
		await service.emitDiskModuleGraph();

		for (const file of [
			"source.ts",
			"browser.ts",
			"registry.ts",
			"types.d.ts",
			"env.d.ts",
		]) {
			expect(existsSync(join(outDir, file))).toBe(true);
		}
		expect(existsSync(join(projectRoot, "docvia-env.d.ts"))).toBe(false);
		const registry = await readFile(join(outDir, "registry.ts"), "utf-8");
		expect(registry).toContain("from '@docvia/core/source'");
		expect(registry).not.toContain("@docvia/core/render");
	});
});

describe("generateVirtualSource", () => {
	it("indexes frontmatter eagerly and bodies lazily through Vite globs", () => {
		const mod = generateVirtualSource(
			[{ name: "docs", baseUrl: "/docs", dir: join(projectRoot, "docs") }],
			projectRoot,
		);
		expect(mod).toContain(
			'import.meta.glob("/docs/**/*.md", { eager: true, import: "meta", query: "?docvia&collection=docs&only=meta" })',
		);
		expect(mod).toContain(
			'import.meta.glob("/docs/**/*.md", { query: "?docvia&collection=docs" })',
		);
		expect(mod).toContain("createSource");
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
		expect(await service.getDocument("docs", "b")).toBeUndefined();

		await rm(dir, { recursive: true, force: true });
	});
});

// A configured `frontmatter` schema is the package's headline feature: fields it
// validates must be readable at runtime. They used to be validated at build and
// then dropped by `toPageMeta`, so `getPage().data` had no custom fields while
// the generated types insisted it did.
describe("custom frontmatter reaches the emitted meta", () => {
	// A minimal Standard Schema — no Zod needed. It coerces `date` to a real Date,
	// which is precisely the value JSON.stringify cannot round-trip.
	const frontmatter = {
		"~standard": {
			version: 1 as const,
			vendor: "test",
			validate: (value: unknown) => {
				const v = value as Record<string, unknown>;
				return {
					value: {
						title: String(v.title ?? ""),
						description: "",
						tags: [] as string[],
						draft: Boolean(v.draft ?? false),
						author: String(v.author ?? ""),
						date: new Date(String(v.date ?? 0)),
					},
				};
			},
		},
	};

	it("keeps custom fields (and draft) on the compiled page meta", async () => {
		const dir = await mkdtemp(join(tmpdir(), "docvia-fm-"));
		await mkdir(join(dir, "docs"), { recursive: true });
		await writeFile(
			join(dir, "docs", "post.md"),
			"---\ntitle: Post\nauthor: Ada\ndraft: true\ndate: 2026-07-13\n---\n\n# Post\n",
			"utf-8",
		);

		const service = new CompileService({
			sourceDir: "docs",
			outDir: join(dir, ".docvia"),
			renderer: stubRenderer,
			plugins: [],
			config: defineConfig({ frontmatter }),
			projectRoot: dir,
		});
		await service.compileAll();

		const doc = await service.getDocument("docs", "post");
		expect(doc).toBeDefined();
		const meta = toPageMeta(doc!);

		expect(meta.author).toBe("Ada");
		expect(meta.draft).toBe(true);
		expect(meta.title).toBe("Post");

		// The renderers emit meta via JSON.stringify — a Date lands as a string.
		// The generated type says `string` too (Jsonify), so this is honest.
		const roundTripped = JSON.parse(JSON.stringify(meta));
		expect(typeof roundTripped.date).toBe("string");

		await rm(dir, { recursive: true, force: true });
	});

	// Only the configured-schema path composes a type; with no schema the codegen
	// emits a union of the literal frontmatter samples it saw, which is already
	// JSON and needs no projection.
	it("emits a Jsonify-projected Frontmatter type for a configured schema", async () => {
		const dir = await mkdtemp(join(tmpdir(), "docvia-fm-types-"));
		await mkdir(join(dir, "docs"), { recursive: true });
		await writeFile(
			join(dir, "docs", "post.md"),
			"---\ntitle: Post\n---\n\n# Post\n",
			"utf-8",
		);
		// frontmatterTypeExpression() only composes when it knows the config path.
		await writeFile(
			join(dir, "docvia.config.ts"),
			"export default {};\n",
			"utf-8",
		);

		const service = new CompileService({
			sourceDir: "docs",
			outDir: join(dir, ".docvia"),
			renderer: stubRenderer,
			plugins: [],
			config: defineConfig({ frontmatter }),
			configPath: join(dir, "docvia.config.ts"),
			projectRoot: dir,
		});
		await service.compileAll();
		await service.emitTypeDeclarations();

		const types = await readFile(join(dir, ".docvia", "types.d.ts"), "utf-8");
		expect(types).toContain("type Jsonify<T>");
		expect(types).toContain("docs_Frontmatter = Jsonify<");

		await rm(dir, { recursive: true, force: true });
	});
});
