import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompilerOptions, IRDocument, RendererAdapter } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import { CompileService } from "@docvia/runtime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BundledContentProvider, createDocviaSSR } from "../src/index";
import { FsContentProvider } from "../src/node";

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
let service: CompileService;

beforeAll(async () => {
	projectRoot = await mkdtemp(join(tmpdir(), "docvia-ssr-"));
	await mkdir(join(projectRoot, "docs"), { recursive: true });
	await writeFile(
		join(projectRoot, "docs", "intro.md"),
		"---\ntitle: Intro\n---\n\n# Intro\n\nHello SSR.\n",
		"utf-8",
	);

	const options: CompilerOptions = {
		sourceDir: "docs",
		outDir: join(projectRoot, ".docvia"),
		renderer: stubRenderer,
		plugins: [],
		config: defineConfig({}),
		projectRoot,
		incremental: false,
	};
	service = new CompileService(options);
	await service.compileAll();
	await service.emitDiskModuleGraph();
});

afterAll(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

describe("IR chunk emission", () => {
	it("writes a per-route chunk and a manifest", () => {
		const irDir = join(projectRoot, ".docvia", "ir");
		expect(existsSync(join(irDir, "manifest.json"))).toBe(true);
		expect(existsSync(join(irDir, "docs", "intro.json"))).toBe(true);

		const manifest = JSON.parse(
			readFileSync(join(irDir, "manifest.json"), "utf-8"),
		);
		expect(manifest.docs.intro).toBe("docs/intro.json");
	});
});

describe("FsContentProvider", () => {
	it("renders a page from a live CompileService", async () => {
		const ssr = createDocviaSSR({ provider: FsContentProvider(service) });
		const page = await ssr.render("docs", "intro");

		expect(page).toBeDefined();
		expect(page?.content.kind).toBe("fragment");
		expect(page?.data.title).toBe("Intro");
	});
});

describe("BundledContentProvider", () => {
	it("renders a page from an emitted IR chunk", async () => {
		const loadChunk = (collection: string, slug: string): IRDocument => {
			const path = join(
				projectRoot,
				".docvia",
				"ir",
				collection,
				`${slug}.json`,
			);
			return JSON.parse(readFileSync(path, "utf-8")) as IRDocument;
		};
		const ssr = createDocviaSSR({
			provider: BundledContentProvider(loadChunk),
		});
		const page = await ssr.render("docs", "intro");

		expect(page).toBeDefined();
		expect(page?.content.kind).toBe("fragment");
		expect(page?.data.title).toBe("Intro");
	});
});
