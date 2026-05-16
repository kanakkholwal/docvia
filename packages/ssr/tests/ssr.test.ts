import type { IRDocument, IRNode } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import {
	BundledContentProvider,
	createDocviaSSR,
	LRUCache,
} from "../src/index";

function text(value: string): IRNode {
	return { type: "text", props: { value }, children: [] };
}

function fixtureIr(slug = "intro", contentHash = "hash-1"): IRDocument {
	return {
		slug,
		frontmatter: { title: "Intro", description: "An intro", tags: ["a"] },
		children: [
			{
				type: "heading",
				id: "h1",
				props: { depth: 1, id: "intro" },
				children: [text("Intro")],
			},
			{
				type: "paragraph",
				id: "p1",
				props: {},
				children: [text("Hello.")],
			},
		],
		headings: [{ depth: 1, text: "Intro", id: "intro" }],
		dependencies: [],
		contentHash,
	};
}

describe("createDocviaSSR", () => {
	it("renders an IR document to a page tree", async () => {
		const ssr = createDocviaSSR({
			provider: BundledContentProvider(() => fixtureIr()),
			baseUrl: "/docs",
		});
		const page = await ssr.render("docs", "intro");

		expect(page).toBeDefined();
		expect(page?.content.kind).toBe("fragment");
		expect(page?.data.title).toBe("Intro");
		expect(page?.url).toBe("/docs/intro");
		expect(page?.slugs).toEqual(["intro"]);
		expect(page?.headings).toHaveLength(1);
		expect(page?.contentHash).toBe("hash-1");
	});

	it("returns undefined when the provider has no document", async () => {
		const ssr = createDocviaSSR({
			provider: BundledContentProvider(() => undefined),
		});
		expect(await ssr.render("docs", "missing")).toBeUndefined();
	});

	it("serves repeat requests from the LRU cache", async () => {
		const ir = fixtureIr();
		const ssr = createDocviaSSR({
			provider: BundledContentProvider(() => ir),
		});
		const first = await ssr.render("docs", "intro");
		const second = await ssr.render("docs", "intro");
		// Identical contentHash → cache hit → the exact same page object.
		expect(second).toBe(first);

		ssr.clearCache();
		const third = await ssr.render("docs", "intro");
		expect(third).not.toBe(first);
		expect(third?.contentHash).toBe(first?.contentHash);
	});

	it("re-renders when the contentHash changes", async () => {
		let hash = "v1";
		const ssr = createDocviaSSR({
			provider: BundledContentProvider(() => fixtureIr("intro", hash)),
		});
		const v1 = await ssr.render("docs", "intro");
		hash = "v2";
		const v2 = await ssr.render("docs", "intro");

		expect(v1?.contentHash).toBe("v1");
		expect(v2?.contentHash).toBe("v2");
		expect(v2).not.toBe(v1);
	});
});

describe("LRUCache", () => {
	it("evicts the least-recently-used entry past capacity", () => {
		const cache = new LRUCache<string, number>(2);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.get("a"); // "a" is now most-recently-used
		cache.set("c", 3); // evicts "b"

		expect(cache.get("a")).toBe(1);
		expect(cache.get("b")).toBeUndefined();
		expect(cache.get("c")).toBe(3);
		expect(cache.size).toBe(2);
	});
});
