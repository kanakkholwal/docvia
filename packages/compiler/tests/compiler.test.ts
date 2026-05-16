import type { FileEntry, IRDocument } from "@docvia/ir";
import { describe, expect, it } from "vitest";

describe("compiler public API", () => {
	it("exposes compile and hashing helpers", async () => {
		const module = await import("../src/index");

		expect(typeof module.compile).toBe("function");
		expect(typeof module.computeContentHash).toBe("function");
		// hashContent is the backwards-compatible alias of computeContentHash.
		expect(module.hashContent).toBe(module.computeContentHash);
	});

	it("validates FileEntry structure", () => {
		const fileEntry: FileEntry = {
			path: "/docs/test.md",
			relativePath: "test.md",
			content: "# Test\n\nContent here",
			hash: "abc123",
		};

		expect(fileEntry.path).toBe("/docs/test.md");
		expect(fileEntry.relativePath).toBe("test.md");
		expect(fileEntry.content).toBeTruthy();
		expect(fileEntry.hash).toBeTruthy();
	});

	it("validates IRDocument structure", () => {
		const doc: IRDocument = {
			slug: "test-page",
			frontmatter: {
				title: "Test Page",
				description: "A test page",
				tags: ["test"],
			},
			children: [],
			headings: [],
			dependencies: [],
			contentHash: "hash123",
		};

		expect(doc.slug).toBe("test-page");
		expect(doc.frontmatter.title).toBe("Test Page");
		expect(Array.isArray(doc.children)).toBe(true);
		expect(Array.isArray(doc.headings)).toBe(true);
		expect(Array.isArray(doc.dependencies)).toBe(true);
	});
});
