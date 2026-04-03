import { docviaError } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import { extractFrontmatter } from "../src/index";

describe("extractFrontmatter", () => {
	it("extracts frontmatter and content from document with YAML block", () => {
		const doc = "---\ntitle: Test\n---\nContent here";
		const result = extractFrontmatter(doc);

		expect(result.data.title).toBe("Test");
		expect(result.content).toBe("Content here");
		expect(result.bodyOffset).toBe(4);
	});

	it("returns empty data and original content when no frontmatter", () => {
		const doc = "Just content\nNo frontmatter";
		const result = extractFrontmatter(doc);

		expect(result.data).toEqual({});
		expect(result.content).toBe(doc);
		expect(result.bodyOffset).toBe(1);
	});

	it("returns empty frontmatter when block is empty", () => {
		const doc = "---\n---\nContent";
		const result = extractFrontmatter(doc);

		expect(result.data).toEqual({});
		expect(result.content).toBe("Content");
		expect(result.bodyOffset).toBe(3);
	});

	it("returns empty data when frontmatter contains only whitespace", () => {
		const doc = "---\n   \n\n---\nContent";
		const result = extractFrontmatter(doc);

		expect(result.data).toEqual({});
		expect(result.content).toBe("Content");
	});

	it("parses YAML with multiple fields", () => {
		const doc =
			"---\ntitle: My Page\ndescription: A test page\nslug: my-page\ntags:\n  - test\n  - example\n---\nBody";
		const result = extractFrontmatter(doc);

		expect(result.data.title).toBe("My Page");
		expect(result.data.description).toBe("A test page");
		expect(result.data.slug).toBe("my-page");
		expect(Array.isArray(result.data.tags)).toBe(true);
	});

	it("throws error when frontmatter is not closed", () => {
		const doc = "---\ntitle: Test\nNo closing delimiter";

		expect(() => extractFrontmatter(doc)).toThrow(docviaError);
	});

	it("throws error with proper context for unclosed frontmatter", () => {
		const doc = "---\ntitle: Test";

		try {
			extractFrontmatter(doc);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.code).toBe("SCHEMA_ERROR");
				expect(err.message).toContain("Unclosed frontmatter");
			}
		}
	});

	it("throws error for invalid YAML", () => {
		const doc =
			"---\ntitle: Test\n  invalid:\n    unbalanced: [list\n---\nContent";

		try {
			extractFrontmatter(doc);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.code).toBe("SCHEMA_ERROR");
				expect(err.message).toContain("Invalid YAML");
			}
		}
	});

	it("handles Windows line endings (CRLF)", () => {
		const doc = "---\r\ntitle: Test\r\n---\r\nContent";
		const result = extractFrontmatter(doc);

		expect(result.data.title).toBe("Test");
		expect(result.content).toBe("Content");
	});

	it("handles mixed line endings", () => {
		const doc = "---\ntitle: Test\r\n---\nContent";
		const result = extractFrontmatter(doc);

		expect(result.data.title).toBe("Test");
	});

	it("preserves content formatting", () => {
		const content =
			"# Heading\n\nParagraph with **bold** text.\n\n```code\nblock\n```";
		const doc = `---\ntitle: Test\n---\n${content}`;
		const result = extractFrontmatter(doc);

		expect(result.content).toBe(content);
	});

	it("handles YAML scalar formats", () => {
		const doc =
			'---\ntitle: |\n  Multiline\n  title\ndescription: "quoted string"\n---\nBody';
		const result = extractFrontmatter(doc);

		expect(typeof result.data.title).toBe("string");
		expect(typeof result.data.description).toBe("string");
	});

	it("handles null/undefined YAML values", () => {
		const doc = "---\ntitle: ~\nother: null\n---\nBody";
		const result = extractFrontmatter(doc);

		expect(result.data.title).toBeNull();
		expect(result.data.other).toBeNull();
	});

	it("returns correct bodyOffset for different document sizes", () => {
		const doc1 = "---\n---\nBody";
		const result1 = extractFrontmatter(doc1);
		expect(result1.bodyOffset).toBe(3);

		const doc2 = "---\ntitle: Test\ndesc: Test\n---\nBody";
		const result2 = extractFrontmatter(doc2);
		expect(result2.bodyOffset).toBe(5);
	});
});
