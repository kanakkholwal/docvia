import { beforeEach, describe, expect, it } from "vitest";
import {
	createCollection,
	createSource,
	type ModuleExports,
} from "../src/internal";

// A synthetic module graph mirroring what `.docvia/source.ts` wires up: a flat
// map of route key -> compiled module ({ meta, content, manifest }). No bundler,
// no filesystem — `createCollection` is pure logic over these route keys.
const MODULES: Record<string, ModuleExports> = {
	index: { meta: { title: "Home", order: 0 }, content: "home", manifest: {} },
	guide: {
		meta: { title: "Guide", order: 1 },
		content: "guide",
		manifest: {},
	},
	"guide/install": {
		meta: { title: "Install", order: 0 },
		content: "install",
		manifest: {},
	},
	"guide/config": {
		meta: { title: "Config", order: 1 },
		content: "config",
		manifest: {},
	},
	api: { meta: { title: "API", order: 2 }, content: "api", manifest: {} },
};

const ROUTE_KEYS = Object.keys(MODULES) as Array<keyof typeof MODULES & string>;

function makeCollection() {
	return createCollection({
		name: "docs",
		baseUrl: "/docs",
		routeKeys: ROUTE_KEYS,
		getModule: async (slug) => MODULES[slug],
		getEagerModules: async () => MODULES,
		sourceModuleUrl: "test://source",
	});
}

// Eager module metadata (title/order) resolves asynchronously; the page tree
// and getPages() fall back to slug-derived values until it settles. Touching
// getPages() kicks off background resolution; a macrotask tick lets it cache
// before we read metadata or build the tree.
async function withEagerMetadata(c: ReturnType<typeof makeCollection>) {
	c.getPages();
	await new Promise((resolve) => setTimeout(resolve, 0));
	return c;
}

describe("createCollection", () => {
	let docs: ReturnType<typeof makeCollection>;

	beforeEach(() => {
		docs = makeCollection();
	});

	describe("getPage", () => {
		it("resolves a page by slug segments", async () => {
			const page = await docs.getPage(["guide", "install"]);
			expect(page).toBeDefined();
			expect(page?.slugs).toEqual(["guide", "install"]);
			expect(page?.url).toBe("/docs/guide/install");
			expect(page?.content).toBe("install");
			expect((page?.data as { title: string }).title).toBe("Install");
		});

		it("maps an empty slug array to the index route", async () => {
			const page = await docs.getPage([]);
			expect(page).toBeDefined();
			expect(page?.slugs).toEqual([]);
			// index collapses to the bare baseUrl.
			expect(page?.url).toBe("/docs");
			expect(page?.content).toBe("home");
		});

		it("returns undefined for an unknown slug", async () => {
			expect(await docs.getPage(["does", "not", "exist"])).toBeUndefined();
		});

		it("ignores empty segments when keying", async () => {
			const page = await docs.getPage(["", "guide", ""]);
			expect(page?.slugs).toEqual(["guide"]);
			expect(page?.url).toBe("/docs/guide");
		});
	});

	describe("getPages", () => {
		it("lists every route with its slugs and url", () => {
			const pages = docs.getPages();
			expect(pages).toHaveLength(ROUTE_KEYS.length);

			const index = pages.find((p) => p.url === "/docs");
			expect(index?.slugs).toEqual([]);

			const install = pages.find((p) => p.url === "/docs/guide/install");
			expect(install?.slugs).toEqual(["guide", "install"]);
		});

		it("carries frontmatter data once eager metadata resolves", async () => {
			await withEagerMetadata(docs);
			const install = docs
				.getPages()
				.find((p) => p.url === "/docs/guide/install");
			expect((install?.data as { title: string }).title).toBe("Install");
		});
	});

	describe("pageTree", () => {
		it("nests children under their parent folder", () => {
			const tree = docs.pageTree;
			expect(tree.name).toBe("docs");

			const guide = tree.children.find(
				(n) => n.type === "folder" && n.name === "Guide",
			);
			expect(guide).toBeDefined();
			if (guide?.type !== "folder") throw new Error("expected folder");

			// `guide` is itself a route, so it becomes the folder's index.
			expect(guide.index?.url).toBe("/docs/guide");

			const childUrls = guide.children
				.filter((n) => n.type === "page")
				.map((n) => (n.type === "page" ? n.url : ""));
			expect(childUrls).toContain("/docs/guide/install");
			expect(childUrls).toContain("/docs/guide/config");
		});

		it("orders children by frontmatter order then slug", async () => {
			// Order comes from eager metadata — resolve it before building the tree.
			await withEagerMetadata(docs);
			const tree = docs.pageTree;
			const guide = tree.children.find(
				(n) => n.type === "folder" && n.name === "Guide",
			);
			if (guide?.type !== "folder") throw new Error("expected folder");
			const pageNames = guide.children
				.filter((n) => n.type === "page")
				.map((n) => n.name);
			// install (order 0) before config (order 1).
			expect(pageNames).toEqual(["Install", "Config"]);
		});

		it("caches the tree across accesses", () => {
			expect(docs.pageTree).toBe(docs.pageTree);
			expect(docs.getPageTree()).toBe(docs.pageTree);
		});
	});

	describe("generateParams", () => {
		it("emits Next.js-style params for every route", () => {
			const params = docs.generateParams();
			expect(params).toContainEqual({ slug: [] });
			expect(params).toContainEqual({ slug: ["guide", "install"] });
		});

		it("honors a custom param name", () => {
			const params = docs.generateParams("path");
			expect(params).toContainEqual({ path: ["api"] });
		});
	});
});

describe("createSource", () => {
	it("exposes its collections map", () => {
		const source = createSource({ docs: makeCollection() });
		expect(source.collections.docs).toBeDefined();
		expect(source.collections.docs.pageTree.name).toBe("docs");
	});
});
