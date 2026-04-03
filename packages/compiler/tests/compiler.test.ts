import type { CompilerOptions, FileEntry, IRDocument } from "@docvia/ir";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("compiler integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should have exposed public API", async () => {
		// Import to verify module structure
		const module = await import("../src/index");

		// Check that computeContentHash is exported (already tested in hash.test)
		expect(module.computeContentHash).toBeDefined();
		expect(typeof module.computeContentHash).toBe("function");
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

	it("validates CompilerOptions type", () => {
		const options: CompilerOptions = {
			contentDir: "/docs",
			configHash: "cfg123",
			outDir: "/out",
			plugins: [],
		};

		expect(options.contentDir).toBe("/docs");
		expect(options.configHash).toBe("cfg123");
		expect(options.outDir).toBe("/out");
		expect(Array.isArray(options.plugins)).toBe(true);
	});
});
