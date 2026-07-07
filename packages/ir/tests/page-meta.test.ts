import { describe, expect, it } from "vitest";
import type { IRDocument } from "../src/index";
import { toPageMeta } from "../src/index";

function makeIR(overrides: Partial<IRDocument> = {}): IRDocument {
	return {
		slug: "guide/intro",
		frontmatter: {
			title: "Intro",
			description: "An intro",
			tags: ["a", "b"],
			order: 2,
		},
		children: [],
		headings: [{ depth: 1, text: "Intro", id: "intro" }],
		dependencies: [],
		contentHash: "hash123",
		...overrides,
	} as IRDocument;
}

describe("toPageMeta", () => {
	it("maps frontmatter, headings, slug, and hash into PageMeta", () => {
		const meta = toPageMeta(makeIR());
		expect(meta.slug).toBe("guide/intro");
		expect(meta.title).toBe("Intro");
		expect(meta.description).toBe("An intro");
		expect(meta.tags).toEqual(["a", "b"]);
		expect(meta.order).toBe(2);
		expect(meta.headings).toHaveLength(1);
		expect(meta.contentHash).toBe("hash123");
		expect(typeof meta.lastModified).toBe("number");
	});

	it("carries an absent order through as undefined", () => {
		const meta = toPageMeta(
			makeIR({
				frontmatter: { title: "t", description: "", tags: [] },
			}),
		);
		expect(meta.order).toBeUndefined();
		expect(meta.tags).toEqual([]);
	});
});
