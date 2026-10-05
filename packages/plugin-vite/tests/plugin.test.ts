import {
	mkdir,
	mkdtemp,
	rename,
	rm,
	unlink,
	writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import type { docviaConfig, RendererAdapter } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import {
	createServer,
	type RunnableDevEnvironment,
	type ViteDevServer,
} from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { docvia } from "../src/plugin";

const stubRenderer: RendererAdapter = {
	name: "stub",
	async renderPage(doc) {
		const meta = { title: doc.frontmatter.title, headings: doc.headings };
		return {
			slug: doc.slug,
			code: `export const meta = ${JSON.stringify(meta)};\nexport const content = ${JSON.stringify(doc.slug)};\nexport const manifest = [];`,
			contentHash: doc.contentHash,
		};
	},
	async renderManifest() {
		return "";
	},
};

const page = (title: string) => `---\ntitle: ${title}\n---\n\n# ${title}\n`;

// Fixtures live under tests/ so `@docvia/source` resolves from this package's node_modules.
let base: string;
let appRoot: string;
let externalDir: string;

async function makeProject(): Promise<docviaConfig> {
	base = await mkdtemp(join(import.meta.dirname, "tmp-"));
	appRoot = join(base, "app");
	externalDir = join(base, "external", "docs");
	await mkdir(join(appRoot, "docs"), { recursive: true });
	await mkdir(externalDir, { recursive: true });
	await writeFile(join(appRoot, "docs", "intro.md"), page("Intro"));
	await writeFile(join(externalDir, "widget.md"), page("Widget"));
	return defineConfig({
		outDir: ".docvia",
		collections: [
			{ name: "docs", sourceDir: "docs", baseUrl: "/docs" },
			{ name: "pro", sourceDir: "../external/docs", baseUrl: "/pro" },
			{ name: "missing", sourceDir: "nope", optional: true },
		],
		renderer: stubRenderer,
	});
}

type Hooks = {
	config(c: { root?: string }): Promise<Record<string, unknown>>;
	configResolved(c: { root: string; command: string }): void;
	buildStart(): Promise<void>;
	resolveId(id: string): string | null;
	load(this: unknown, id: string): Promise<string | null>;
};

describe("docvia() hooks", () => {
	let config: docviaConfig;
	beforeAll(async () => {
		config = await makeProject();
	});
	afterAll(() => rm(base, { recursive: true, force: true }));

	async function setup(command: "serve" | "build") {
		const plugin = docvia(config) as unknown as Hooks;
		await plugin.config({ root: appRoot });
		plugin.configResolved({ root: appRoot, command });
		await plugin.buildStart();
		return plugin;
	}

	it("serves the source, browser and registry modules", async () => {
		const plugin = await setup("build");
		const ctx = { environment: { config: { consumer: "server" } } };
		for (const id of [
			"virtual:docvia/source",
			"virtual:docvia/source/browser",
			"virtual:docvia/registry",
		]) {
			const resolved = plugin.resolveId(id);
			expect(resolved).toBe(`\0${id}`);
			expect(await plugin.load.call(ctx, resolved as string)).toBeTypeOf(
				"string",
			);
		}
		const registry = await plugin.load.call(ctx, "\0virtual:docvia/registry");
		expect(registry).toContain("export const registry");
		expect(plugin.resolveId("docvia:source")).toBeNull();
	});

	it("adds runtime packages to optimizeDeps and ssr.noExternal", async () => {
		const plugin = docvia({
			...config,
			renderer: { ...stubRenderer, runtimePackages: ["@docvia/stub"] },
		}) as unknown as Hooks;
		const out = await plugin.config({ root: appRoot });
		expect(out).toMatchObject({
			optimizeDeps: { include: ["@docvia/source/internal", "@docvia/stub"] },
			ssr: { noExternal: ["@docvia/stub"] },
		});
	});

	it("loads docvia.config from the root when no config is passed", async () => {
		await writeFile(
			join(appRoot, "docvia.config.mjs"),
			"export default { collections: [{ name: 'docs', sourceDir: 'docs' }], renderer: { name: 'inline', renderPage: async () => ({ slug: '', code: '', contentHash: '' }), renderManifest: async () => '' } };",
		);
		try {
			const plugin = docvia() as unknown as Hooks;
			await expect(plugin.config({ root: appRoot })).resolves.toBeDefined();
		} finally {
			await unlink(join(appRoot, "docvia.config.mjs"));
		}
	});

	it("throws when the config has no renderer", async () => {
		const plugin = docvia(
			defineConfig({ sourceDir: "docs" }),
		) as unknown as Hooks;
		await expect(plugin.config({ root: appRoot })).rejects.toThrow(/renderer/i);
	});
});

describe("docvia() on a live dev server", () => {
	let server: ViteDevServer;
	let ssr: RunnableDevEnvironment;

	beforeAll(async () => {
		const config = await makeProject();
		server = await createServer({
			root: appRoot,
			configFile: false,
			logLevel: "silent",
			server: { middlewareMode: true, ws: false },
			plugins: [docvia(config)],
		});
		ssr = server.environments.ssr as RunnableDevEnvironment;
	});
	afterAll(async () => {
		await server?.close();
		await rm(base, { recursive: true, force: true });
	});

	type Collection = {
		getPages(): Array<{ url: string }>;
		getPage(
			slugs: string[],
		): Promise<{ content: unknown; data: unknown } | undefined>;
	};
	type Source = Record<"docs" | "pro" | "missing", Collection>;
	const load = () => ssr.runner.import<Source>("virtual:docvia/source");
	const urls = async () => {
		const mod = await load();
		return [...mod.docs.getPages(), ...mod.pro.getPages()]
			.map((p) => p.url)
			.sort();
	};
	async function eventually(expected: string[]): Promise<void> {
		const deadline = Date.now() + 8000;
		let last: string[] = [];
		while (Date.now() < deadline) {
			last = await urls();
			if (JSON.stringify(last) === JSON.stringify(expected)) return;
			await new Promise((r) => setTimeout(r, 100));
		}
		expect(last).toEqual(expected);
	}

	it("serves every collection, including one outside the root", async () => {
		await eventually(["/docs/intro", "/pro/widget"]);
		const mod = await load();
		expect(mod.missing.getPages()).toEqual([]);
	});

	it("picks up a renamed file without a restart", async () => {
		await rename(
			join(appRoot, "docs", "intro.md"),
			join(appRoot, "docs", "start.md"),
		);
		await eventually(["/docs/start", "/pro/widget"]);
		const mod = await load();
		expect((await mod.docs.getPage(["start"]))?.content).toBe("start");
	});

	it("picks up files added and deleted outside the root", async () => {
		await writeFile(join(externalDir, "gauge.md"), page("Gauge"));
		await eventually(["/docs/start", "/pro/gauge", "/pro/widget"]);
		await unlink(join(externalDir, "widget.md"));
		await eventually(["/docs/start", "/pro/gauge"]);
	});

	it("recompiles an edit outside the root", async () => {
		await writeFile(join(externalDir, "gauge.md"), page("Gauge v2"));
		const deadline = Date.now() + 8000;
		let title: unknown;
		while (Date.now() < deadline) {
			const mod = await load();
			title = (await mod.pro.getPage(["gauge"]))?.data;
			if ((title as { title?: string })?.title === "Gauge v2") return;
			await new Promise((r) => setTimeout(r, 100));
		}
		expect(title).toMatchObject({ title: "Gauge v2" });
	});
});
