import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompilerOptions, RendererAdapter } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import { CompileService } from "@docvia/runtime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDocviaSSR } from "../src/index";

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
});

afterAll(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

describe("createDocviaSSR with a live CompileService", () => {
	it("renders a page resolved through the service provider", async () => {
		// A CompileService is structurally a ContentProvider (it has
		// getDocument), so it can be passed straight to createDocviaSSR.
		const ssr = createDocviaSSR({ provider: service });
		const page = await ssr.render("docs", "intro");

		expect(page).toBeDefined();
		expect(page?.content.kind).toBe("fragment");
		expect(page?.data.title).toBe("Intro");
	});
});
