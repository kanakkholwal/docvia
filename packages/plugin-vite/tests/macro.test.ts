import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RendererAdapter } from "@docvia/ir";
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
		const meta = { ...doc.frontmatter, headings: doc.headings };
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

const page = (title: string, extra = "") =>
	`---\ntitle: ${title}\n${extra}---\n\n## Setup\n\nText.\n`;

const SOURCE = `import { defineDocs } from "@docvia/source/macro";
import { loader } from "@docvia/source";

const docs = defineDocs({ dir: "content/docs" });
export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
`;

type Page = {
	url: string;
	data: {
		title: string;
		load(): Promise<{ content: unknown; toc: unknown[] }>;
	};
};
type Loaded = {
	source: {
		getPage(slugs: string[]): Page | undefined;
		getPages(): Page[];
		getPageTree(): { children: Array<{ name: string; type: string }> };
		getPageByHref(href: string): { page: Page; hash?: string } | undefined;
	};
};

let base: string;
let server: ViteDevServer;
let ssr: RunnableDevEnvironment;
const docsDir = () => join(base, "content", "docs");

beforeAll(async () => {
	base = await mkdtemp(join(import.meta.dirname, "tmp-"));
	await mkdir(join(docsDir(), "guide"), { recursive: true });
	await mkdir(join(base, "lib"), { recursive: true });
	await writeFile(join(docsDir(), "index.md"), page("Home"));
	await writeFile(join(docsDir(), "guide", "install.md"), page("Install"));
	await writeFile(join(docsDir(), "guide", "config.md"), page("Config"));
	await writeFile(
		join(docsDir(), "guide", "meta.json"),
		JSON.stringify({ title: "Guides", pages: ["install", "config"] }),
	);
	await writeFile(join(base, "lib", "source.ts"), SOURCE);
	server = await createServer({
		root: base,
		configFile: false,
		logLevel: "silent",
		server: { middlewareMode: true, ws: false },
		plugins: [docvia(defineConfig({ renderer: stubRenderer }))],
	});
	ssr = server.environments.ssr as RunnableDevEnvironment;
});

afterAll(async () => {
	await server?.close();
	await rm(base, { recursive: true, force: true });
});

const load = () => ssr.runner.import<Loaded>("/lib/source.ts");

async function eventually(check: (m: Loaded) => boolean | Promise<boolean>) {
	const deadline = Date.now() + 8000;
	for (;;) {
		ssr.runner.clearCache();
		const mod = await load();
		if (await check(mod)) return mod;
		if (Date.now() > deadline) throw new Error("timed out");
		await new Promise((r) => setTimeout(r, 100));
	}
}

describe("defineDocs() + loader()", () => {
	it("indexes frontmatter and loads bodies on demand", async () => {
		const { source } = await load();
		expect(
			source
				.getPages()
				.map((p) => p.url)
				.sort(),
		).toEqual(["/docs", "/docs/guide/config", "/docs/guide/install"]);
		const install = source.getPage(["guide", "install"]);
		expect(install?.data.title).toBe("Install");
		const body = await install?.data.load();
		expect(body?.content).toBe("guide/install");
		expect(body?.toc).toEqual([{ title: "Setup", url: "#setup", depth: 2 }]);
		expect(source.getPageByHref("/docs/guide/config#setup")?.hash).toBe(
			"setup",
		);
	});

	it("orders the tree from meta.json", async () => {
		const { source } = await load();
		const guide = source
			.getPageTree()
			.children.find((n) => n.type === "folder") as unknown as {
			name: string;
			children: Array<{ name: string }>;
		};
		expect(guide.name).toBe("Guides");
		expect(guide.children.map((c) => c.name)).toEqual(["Install", "Config"]);
	});

	it("picks up frontmatter edits and new pages without a restart", async () => {
		await writeFile(join(docsDir(), "guide", "install.md"), page("Install v2"));
		await eventually(
			(m) =>
				m.source.getPage(["guide", "install"])?.data.title === "Install v2",
		);
		await writeFile(join(docsDir(), "faq.md"), page("FAQ"));
		await eventually((m) => m.source.getPage(["faq"])?.data.title === "FAQ");
	});
});

describe("defineDocs() with a schema", () => {
	const SCHEMA_SOURCE = `import { defineDocs } from "@docvia/source/macro";
import { loader } from "@docvia/source";

// A Standard Schema without a library: \`component\` is required and upper-cased.
const schema = {
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (value) =>
			typeof value.component === "string"
				? { value: { ...value, component: value.component.toUpperCase() } }
				: { issues: [{ message: "component: required", path: ["component"] }] },
	},
};
const docs = defineDocs({ dir: "components", docs: { schema } });
export const source = loader({ baseUrl: "/components", source: docs.toDocviaSource() });
`;

	it("validates frontmatter with the schema from lib/source.ts", async () => {
		await mkdir(join(base, "components"), { recursive: true });
		await writeFile(
			join(base, "components", "button.md"),
			page("Button", "component: button\n"),
		);
		await writeFile(join(base, "lib", "components.ts"), SCHEMA_SOURCE);
		const mod = await ssr.runner.import<{
			source: {
				getPage(s: string[]): { data: { component: string } } | undefined;
			};
		}>("/lib/components.ts");
		expect(mod.source.getPage(["button"])?.data.component).toBe("BUTTON");
	});

	it("reports frontmatter that breaks the schema", async () => {
		await writeFile(join(base, "components", "card.md"), page("Card"));
		await writeFile(
			join(base, "lib", "components-2.ts"),
			SCHEMA_SOURCE.replace('"components"', '"components"'),
		);
		await expect(ssr.runner.import("/lib/components-2.ts")).rejects.toThrow(
			/component: required/,
		);
	});
});
