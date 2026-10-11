import { describe, expect, it } from "vitest";
import {
	createCollection,
	createSource,
	type ModuleExports,
	type ModuleMeta,
} from "../../src/source/internal";

// What the generated source module passes in: frontmatter per file (eager) and a lazy body
// loader per file, keyed by the same path.
const PAGES: Record<string, { title: string; order: number }> = {
	index: { title: "Home", order: 0 },
	guide: { title: "Guide", order: 1 },
	"guide/install": { title: "Install", order: 0 },
	"guide/config": { title: "Config", order: 1 },
	api: { title: "API", order: 2 },
};
const file = (slug: string) => `/docs/${slug}.md`;
const META: Record<string, ModuleMeta> = Object.fromEntries(
	Object.entries(PAGES).map(([slug, fm]) => [file(slug), { ...fm, slug }]),
);

function makeCollection(loaded: string[] = []) {
	const bodies: Record<string, () => Promise<ModuleExports>> =
		Object.fromEntries(
			Object.entries(PAGES).map(([slug, fm]) => [
				file(slug),
				async () => {
					loaded.push(slug);
					return {
						meta: { ...fm, slug, headings: [{ depth: 2, text: "A", id: "a" }] },
						content: { kind: "text", value: slug },
						manifest: [],
					};
				},
			]),
		);
	return createCollection({
		name: "docs",
		baseUrl: "/docs",
		meta: META,
		bodies,
	});
}

describe("getPage", () => {
	it("resolves a page by slug segments and loads only its body", async () => {
		const loaded: string[] = [];
		const page = await makeCollection(loaded).getPage(["guide", "install"]);
		expect(page?.url).toBe("/docs/guide/install");
		expect(page?.content).toEqual({ kind: "text", value: "guide/install" });
		expect(page?.headings).toEqual([{ depth: 2, text: "A", id: "a" }]);
		expect((page?.data as { title: string } | undefined)?.title).toBe(
			"Install",
		);
		expect(loaded).toEqual(["guide/install"]);
	});

	it("maps an empty slug array to the index route", async () => {
		expect((await makeCollection().getPage([]))?.url).toBe("/docs");
	});

	it("returns undefined for an unknown slug", async () => {
		expect(await makeCollection().getPage(["nope"])).toBeUndefined();
	});

	it("ignores empty segments when keying", async () => {
		expect(
			(await makeCollection().getPage(["guide", "", "install"]))?.url,
		).toBe("/docs/guide/install");
	});
});

describe("getPages", () => {
	it("lists every route with frontmatter, without loading any body", () => {
		const loaded: string[] = [];
		const pages = makeCollection(loaded).getPages();
		expect(pages.map((p) => p.url).sort()).toEqual([
			"/docs",
			"/docs/api",
			"/docs/guide",
			"/docs/guide/config",
			"/docs/guide/install",
		]);
		const api = pages.find((p) => p.url === "/docs/api");
		expect((api?.data as { title: string } | undefined)?.title).toBe("API");
		expect(loaded).toEqual([]);
	});
});

describe("pageTree", () => {
	it("nests children under their folder, ordered by `order` then slug", () => {
		const tree = makeCollection().pageTree;
		const guide = tree.children.find((n) => n.type === "folder");
		expect(guide?.type === "folder" && guide.index?.url).toBe("/docs/guide");
		expect(
			guide?.type === "folder" && guide.children.map((c) => c.name),
		).toEqual(["Install", "Config"]);
		expect(tree.children.map((n) => n.name)).toEqual(["Home", "Guide", "API"]);
	});

	it("caches the tree across accesses", () => {
		const c = makeCollection();
		expect(c.pageTree).toBe(c.getPageTree());
	});
});

describe("generateParams", () => {
	it("emits params for every route, honouring a custom name", () => {
		const c = makeCollection();
		expect(c.generateParams()).toContainEqual({ slug: ["guide", "install"] });
		expect(c.generateParams("path")).toContainEqual({ path: [] });
	});
});

describe("createSource", () => {
	it("exposes its collections map", () => {
		const docs = makeCollection();
		expect(createSource({ docs }).collections.docs).toBe(docs);
	});
});
