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

	// The whole point of a configured `frontmatter` schema is that the fields it
	// validates are readable at runtime. Dropping them made the option a no-op.
	it("passes custom frontmatter fields through to meta", () => {
		const meta = toPageMeta(
			makeIR({
				frontmatter: {
					title: "Intro",
					description: "",
					tags: [],
					author: "Ada",
					published: true,
					date: "2026-07-13T00:00:00.000Z",
				},
			}),
		);
		expect(meta.author).toBe("Ada");
		expect(meta.published).toBe(true);
		expect(meta.date).toBe("2026-07-13T00:00:00.000Z");
	});

	it("exposes the built-in draft flag so pages can be filtered on it", () => {
		const meta = toPageMeta(
			makeIR({
				frontmatter: { title: "t", description: "", tags: [], draft: true },
			}),
		);
		expect(meta.draft).toBe(true);
	});

	// Derived fields are computed from the document; frontmatter must not win.
	it("lets derived fields override same-named frontmatter keys", () => {
		const meta = toPageMeta(
			makeIR({
				slug: "guide/intro",
				contentHash: "real-hash",
				frontmatter: {
					title: "Intro",
					description: "",
					tags: [],
					slug: "attacker-supplied",
					contentHash: "attacker-supplied",
					headings: "attacker-supplied",
				},
			}),
		);
		expect(meta.slug).toBe("guide/intro");
		expect(meta.contentHash).toBe("real-hash");
		expect(meta.headings).toHaveLength(1);
	});
});
