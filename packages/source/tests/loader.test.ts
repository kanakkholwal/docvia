import { describe, expect, it } from "vitest";
import { loader, type MetaFile, type PageFile } from "../src/loader";

type D = { title: string; order?: number };
const page = (path: string, title: string, order?: number): PageFile<D> => ({
	type: "page",
	path,
	data: { title, ...(order !== undefined ? { order } : {}) },
});
const meta = (path: string, data: MetaFile["data"]): MetaFile => ({
	type: "meta",
	path,
	data,
});

const files = [
	page("index.md", "Home"),
	page("guide/index.md", "Guide", 1),
	page("guide/install.md", "Install", 1),
	page("guide/config.md", "Config", 0),
	page("guide/advanced/deep.md", "Deep"),
	page("api.md", "API", 2),
	page("internal.md", "Internal"),
];

describe("loader", () => {
	const source = loader<D>({ baseUrl: "/docs", source: { files } });

	it("finds pages by slugs and href", () => {
		expect(source.getPage(["guide", "install"])?.url).toBe(
			"/docs/guide/install",
		);
		expect(source.getPage([])?.data.title).toBe("Home");
		expect(source.getPage(["guide"])?.path).toBe("guide/index.md");
		expect(source.getPageByHref("/docs/api#setup")).toMatchObject({
			page: { path: "api.md" },
			hash: "setup",
		});
	});

	it("builds the tree by `order`, with folders and their index", () => {
		const tree = source.getPageTree();
		expect(tree.children.map((n) => n.name)).toEqual([
			"Home",
			"Guide",
			"API",
			"Internal",
		]);
		const guide = tree.children[1];
		expect(guide?.type === "folder" && guide.index?.url).toBe("/docs/guide");
		expect(
			guide?.type === "folder" && guide.children.map((n) => n.name),
		).toEqual(["Config", "Install", "Advanced"]);
	});

	it("follows meta.json: order, rest, separators, links, exclusions", () => {
		const withMeta = loader<D>({
			baseUrl: "/docs",
			source: {
				files: [
					...files,
					meta("meta.json", {
						title: "Manual",
						pages: [
							"api",
							"---Guides---",
							"guide",
							"...",
							"!internal",
							"[GitHub](https://github.com/x)",
						],
					}),
					meta("guide/meta.json", {
						title: "Guides",
						defaultOpen: true,
						root: true,
					}),
				],
			},
		});
		const tree = withMeta.getPageTree();
		expect(tree.name).toBe("Manual");
		expect(tree.children.map((n) => `${n.type}:${n.name}`)).toEqual([
			"page:Home",
			"page:API",
			"separator:Guides",
			"folder:Guides",
			"page:GitHub",
		]);
		const guide = tree.children[3];
		expect(guide).toMatchObject({
			type: "folder",
			defaultOpen: true,
			root: true,
		});
		expect(tree.children[4]).toMatchObject({
			external: true,
			url: "https://github.com/x",
		});
	});

	it("generates params and honours explicit slugs", () => {
		const custom = loader<D>({
			baseUrl: "/",
			source: { files: [{ ...page("a.md", "A"), slugs: ["custom"] }] },
		});
		expect(custom.getPage(["custom"])?.url).toBe("/custom");
		expect(source.generateParams()).toContainEqual({
			slug: ["guide", "install"],
		});
	});
});
