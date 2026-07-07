import { docviaError } from "@docvia/ir";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, it } from "vitest";
import { z } from "zod/v3";
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

// A minimal, hand-rolled Standard Schema (no validation library) proving the
// pipeline is library-agnostic: it only requires the `~standard` contract.
function customAuthorSchema(): StandardSchemaV1<
	Record<string, unknown>,
	Record<string, unknown>
> {
	return {
		"~standard": {
			version: 1,
			vendor: "custom-test",
			validate(value) {
				const input = value as Record<string, unknown>;
				if (typeof input.author !== "string") {
					return {
						issues: [{ message: "author must be a string", path: ["author"] }],
					};
				}
				return { value: { author: input.author.trim() } };
			},
		},
	};
}

describe("validateFrontmatter with a Standard Schema extension", () => {
	it("accepts any Standard Schema library, not just Zod", () => {
		const data = { title: "Test", author: "  Ada  " };
		const result = validateFrontmatter(data, undefined, customAuthorSchema());

		expect(result.title).toBe("Test");
		// Extension output wins and is merged in (trimmed by the custom schema).
		expect((result as Record<string, unknown>).author).toBe("Ada");
		// Base defaults are still applied.
		expect(result.tags).toEqual([]);
	});

	it("reports extension-schema issues with their path", () => {
		const data = { title: "Test", author: 123 };

		try {
			validateFrontmatter(data, "/docs/x.md", customAuthorSchema());
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.message).toContain("author");
				expect(err.message).toContain("author must be a string");
			}
		}
	});

	it("merges base and extension issues together", () => {
		const data = { author: 123 }; // missing title (base) + bad author (ext)

		try {
			validateFrontmatter(data, undefined, customAuthorSchema());
			expect.fail("Should have thrown");
		} catch (err) {
			if (err instanceof docviaError) {
				expect(err.message).toMatch(/title|Title/i);
				expect(err.message).toContain("author");
			}
		}
	});

	it("rejects asynchronous schemas with a clear error", () => {
		const asyncSchema: StandardSchemaV1 = {
			"~standard": {
				version: 1,
				vendor: "async-test",
				validate: () => Promise.resolve({ value: {} }),
			},
		};

		try {
			validateFrontmatter({ title: "Test" }, undefined, asyncSchema);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(docviaError);
			if (err instanceof docviaError) {
				expect(err.message).toContain("Asynchronous");
			}
		}
	});

	it("works with a Zod extension schema", () => {
		const schema = z.object({ author: z.string().optional() });
		const result = validateFrontmatter(
			{ title: "Test", author: "Ada" },
			undefined,
			schema,
		);

		expect(result.title).toBe("Test");
		expect((result as Record<string, unknown>).author).toBe("Ada");
	});
});
