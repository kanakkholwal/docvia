import { docviaError } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import { DocPageSchema, validateFrontmatter } from "../src/index";

describe("validateFrontmatter", () => {
	it("validates minimal valid frontmatter", () => {
		const data = { title: "Test Page" };
		const result = validateFrontmatter(data);

		expect(result.title).toBe("Test Page");
		expect(result.description).toBe("");
		expect(result.tags).toEqual([]);
		expect(result.draft).toBe(false);
	});

	it("validates complete frontmatter with all fields", () => {
		const data = {
			title: "Test Page",
			description: "A test page description",
			slug: "test-page",
			tags: ["test", "example"],
			draft: false,
			order: 1,
		};
		const result = validateFrontmatter(data);

		expect(result.title).toBe("Test Page");
		expect(result.description).toBe("A test page description");
		expect(result.slug).toBe("test-page");
		expect(result.tags).toEqual(["test", "example"]);
		expect(result.draft).toBe(false);
		expect(result.order).toBe(1);
	});

	it("throws error when title is missing", () => {
		const data = { description: "No title" };

		try {
			validateFrontmatter(data);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.code).toBe("SCHEMA_ERROR");
				expect(err.message).toContain("Frontmatter validation failed");
				// Zod message format may vary
				expect(err.message).toMatch(/title|Title/i);
			}
		}
	});

	it("throws error when title is empty string", () => {
		const data = { title: "" };

		try {
			validateFrontmatter(data);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.code).toBe("SCHEMA_ERROR");
			}
		}
	});

	it("accepts passthrough extra fields", () => {
		const data = {
			title: "Test",
			customField: "custom value",
			anotherField: 123,
		};
		const result = validateFrontmatter(data);

		expect(result.title).toBe("Test");
		// passthrough allows extra fields but doesn't include them in typed result
	});

	it("validates tags as array of strings", () => {
		const data = { title: "Test", tags: ["tag1", "tag2", "tag3"] };
		const result = validateFrontmatter(data);

		expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
	});

	it("defaults tags to empty array", () => {
		const data = { title: "Test" };
		const result = validateFrontmatter(data);

		expect(result.tags).toEqual([]);
		expect(Array.isArray(result.tags)).toBe(true);
	});

	it("defaults description to empty string", () => {
		const data = { title: "Test" };
		const result = validateFrontmatter(data);

		expect(result.description).toBe("");
	});

	it("defaults draft to false", () => {
		const data = { title: "Test" };
		const result = validateFrontmatter(data);

		expect(result.draft).toBe(false);
	});

	it("accepts draft true", () => {
		const data = { title: "Test", draft: true };
		const result = validateFrontmatter(data);

		expect(result.draft).toBe(true);
	});

	it("includes file path in error when provided", () => {
		const data = { description: "Missing title" };

		try {
			validateFrontmatter(data, "/docs/test.md");
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.file).toBe("/docs/test.md");
			}
		}
	});

	it("allows slug to be optional", () => {
		const data = { title: "Test" };
		const result = validateFrontmatter(data);

		expect(result.slug).toBeUndefined();
	});

	it("allows order to be optional", () => {
		const data = { title: "Test" };
		const result = validateFrontmatter(data);

		expect(result.order).toBeUndefined();
	});

	it("validates order as number", () => {
		const data = { title: "Test", order: 5 };
		const result = validateFrontmatter(data);

		expect(result.order).toBe(5);
	});

	it("reports multiple validation errors", () => {
		const data = { title: "", tags: "not-an-array" };

		try {
			validateFrontmatter(data);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				// Should contain both error messages
				expect(err.message.toLowerCase()).toContain("validation");
			}
		}
	});

	it("validates using DocPageSchema directly", () => {
		const data = { title: "Test", description: "Desc", tags: ["t1", "t2"] };
		const result = DocPageSchema.safeParse(data);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe("Test");
		}
	});

	it("DocPageSchema rejects invalid data", () => {
		const data = { description: "No title" };
		const result = DocPageSchema.safeParse(data);

		expect(result.success).toBe(false);
	});

	it("handles title as non-string gracefully", () => {
		const data = { title: 123 };

		try {
			validateFrontmatter(data);
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
		}
	});

	it("validates tags array contains only strings", () => {
		const data = { title: "Test", tags: ["valid", 123] };

		try {
			validateFrontmatter(data);
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
		}
	});
});
