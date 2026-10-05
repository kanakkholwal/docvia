import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FrontmatterSchema, RendererAdapter } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { relativeInside, samePath } from "../src/paths";
import { CompileService } from "../src/service";

const stubRenderer: RendererAdapter = {
	name: "stub",
	async renderPage() {
		return { slug: "", code: "", contentHash: "" };
	},
	async renderManifest() {
		return "";
	},
};

/** Standard Schema that requires `field` to be a string. */
function requires(field: string): FrontmatterSchema {
	return {
		"~standard": {
			version: 1,
			vendor: "test",
			validate: (value: unknown) => {
				const v = value as Record<string, unknown>;
				return typeof v[field] === "string"
					? { value: v }
					: { issues: [{ message: `${field}: expected string` }] };
			},
		},
	};
}

let root: string;
beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), "docvia-collections-"));
	await mkdir(join(root, "guides"), { recursive: true });
	await mkdir(join(root, "components"), { recursive: true });
	await writeFile(join(root, "guides", "start.md"), "---\ntitle: Start\n---\n");
	await writeFile(
		join(root, "components", "button.md"),
		"---\ntitle: Button\ncomponent: Button\nbuild: 1\n---\n",
	);
});
afterEach(() => rm(root, { recursive: true, force: true }));

function service(config: Parameters<typeof defineConfig>[0]) {
	return new CompileService({
		sourceDir: "guides",
		outDir: ".docvia",
		renderer: stubRenderer,
		plugins: [],
		config: defineConfig(config),
		projectRoot: root,
		incremental: false,
	});
}

describe("per-collection frontmatter", () => {
	it("validates each collection against its own schema", async () => {
		const svc = service({
			collections: [
				{ name: "guides", sourceDir: "guides" },
				{
					name: "components",
					sourceDir: "components",
					frontmatter: requires("component"),
				},
			],
		});
		await expect(svc.compileAll()).resolves.toBeDefined();
	});

	it("reports a schema error from the collection that owns the file", async () => {
		const svc = service({
			collections: [
				{
					name: "guides",
					sourceDir: "guides",
					frontmatter: requires("component"),
				},
			],
		});
		await expect(svc.compileAll()).rejects.toThrow(/component/);
	});
});

describe("optional collections", () => {
	it("treats a missing optional sourceDir as empty", async () => {
		const svc = service({
			collections: [
				{ name: "guides", sourceDir: "guides" },
				{ name: "pro", sourceDir: "missing", optional: true },
			],
		});
		await svc.compileAll();
		expect(svc.getVirtualSourceModule()).toContain("export const pro");
	});

	it("names the collection when a required sourceDir is missing", async () => {
		const svc = service({
			collections: [{ name: "pro", sourceDir: "missing" }],
		});
		await expect(svc.compileAll()).rejects.toThrow(/"pro".*optional: true/);
	});
});

describe("hashExclude", () => {
	it("keeps the content hash stable when an excluded field changes", async () => {
		const hashOf = async (build: number, exclude?: string[]) => {
			await writeFile(
				join(root, "components", "button.md"),
				"---\ntitle: Button\n---\n",
			);
			const svc = new CompileService({
				sourceDir: "components",
				outDir: ".docvia",
				renderer: stubRenderer,
				plugins: [
					{
						name: "inject",
						version: "1",
						afterTransform: (doc) => doc,
						beforeParse: (file) => ({
							...file,
							content: file.content.replace("---\n", `---\nbuild: ${build}\n`),
						}),
					},
				],
				config: defineConfig({ hashExclude: exclude }),
				projectRoot: root,
				incremental: false,
			});
			await svc.compileAll();
			return (await svc.getDocument("docs", "button"))?.contentHash;
		};
		expect(await hashOf(1)).not.toBe(await hashOf(2));
		expect(await hashOf(1, ["build"])).toBe(await hashOf(2, ["build"]));
	});
});

describe("components", () => {
	it("fails at compile time when a component file is missing", async () => {
		const svc = service({
			collections: [{ name: "guides", sourceDir: "guides" }],
			components: { card: { path: "./src/Card.svelte" } },
		});
		await expect(svc.compileAll()).rejects.toThrow(/Component "card"/);
	});

	it("expands component globs, naming entries from their files", async () => {
		await mkdir(join(root, "src", "docs"), { recursive: true });
		await writeFile(join(root, "src", "docs", "ButtonDemo.svelte"), "");
		await writeFile(join(root, "src", "docs", "code_group.svelte"), "");
		const svc = service({
			collections: [{ name: "guides", sourceDir: "guides" }],
			components: [
				"./src/docs/*.svelte",
				{
					name: "counter",
					path: "./src/docs/ButtonDemo.svelte",
					hydrate: true,
				},
			],
		});
		await svc.compileAll();
		const registry = svc.getVirtualRegistryModule();
		for (const name of ["button-demo", "code-group", "counter"]) {
			expect(registry).toContain(`"${name}"`);
		}
		expect(svc.componentCount()).toBe(3);
	});

	it("emits an empty but present registry when none are configured", async () => {
		const svc = service({
			collections: [{ name: "guides", sourceDir: "guides" }],
		});
		await svc.compileAll();
		expect(svc.getVirtualRegistryModule()).toContain("export const registry");
	});
});

describe("generated files", () => {
	it("are not rewritten when nothing changed", async () => {
		const svc = service({
			collections: [{ name: "guides", sourceDir: "guides" }],
		});
		await svc.compileAll();
		await svc.emitTypeDeclarations();
		const env = join(root, ".docvia", "env.d.ts");
		const before = (await stat(env)).mtimeMs;
		await new Promise((r) => setTimeout(r, 20));
		await svc.emitTypeDeclarations();
		expect((await stat(env)).mtimeMs).toBe(before);
		expect(await readFile(env, "utf-8")).toContain(
			"declare module 'virtual:docvia/registry'",
		);
	});
});

describe("paths", () => {
	it("rejects look-alike sibling directories", () => {
		expect(relativeInside("/a/docs", "/a/docs-old/x.md")).toBeUndefined();
		expect(relativeInside("/a/docs", "/a/docs/sub/x.md")).toBe("sub/x.md");
		expect(relativeInside("/a/docs", "/a/x.md")).toBeUndefined();
	});

	it.runIf(process.platform === "win32")("ignores case on Windows", () => {
		expect(
			relativeInside("C:\\Users\\Coding\\docs", "c:/users/coding/docs/A.md"),
		).toBe("A.md");
		expect(samePath("C:\\Coding\\x.md", "c:/coding/x.md")).toBe(true);
	});
});
