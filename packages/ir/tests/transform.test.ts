import type { Root as HastRoot } from "hast";
import { describe, expect, it } from "vitest";
import type { FrontmatterData } from "../src/index";
import { normalizeProps, transformToIR } from "../src/transform";

describe("transformToIR", () => {
	const mockFrontmatter: FrontmatterData = {
		title: "Test Page",
		description: "A test page",
		slug: "test",
		tags: ["test"],
	};

	it("transforms basic HAST to IR document", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "p",
					properties: {},
					children: [{ type: "text", value: "Hello world" }],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.slug).toBe("test");
		expect(result.frontmatter).toBe(mockFrontmatter);
		expect(result.children).toHaveLength(1);
		expect(result.children[0]?.type).toBe("paragraph");
		expect(result.headings).toHaveLength(0);
		expect(result.dependencies).toHaveLength(0);
	});

	it("extracts headings with correct depth and slug", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "h1",
					properties: {},
					children: [{ type: "text", value: "Main Title" }],
				},
				{
					type: "element",
					tagName: "h2",
					properties: {},
					children: [{ type: "text", value: "Sub Title" }],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.headings).toHaveLength(2);
		expect(result.headings[0]?.depth).toBe(1);
		expect(result.headings[0]?.text).toBe("Main Title");
		expect(result.headings[1]?.depth).toBe(2);
		expect(result.headings[1]?.text).toBe("Sub Title");
	});

	it("tracks file dependencies in links", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "a",
					properties: { href: "other.md" },
					children: [{ type: "text", value: "Link" }],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.dependencies).toHaveLength(1);
		expect(result.dependencies[0]?.type).toBe("file");
	});

	it("tracks asset dependencies in images", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "img",
					properties: { src: "image.png", alt: "Test image" },
					children: [],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.dependencies).toHaveLength(1);
		expect(result.dependencies[0]?.type).toBe("asset");
	});

	it("ignores external URLs in links", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "a",
					properties: { href: "https://example.com" },
					children: [{ type: "text", value: "External" }],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.dependencies).toHaveLength(0);
	});

	it("transforms code blocks with language detection", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "pre",
					properties: {},
					children: [
						{
							type: "element",
							tagName: "code",
							properties: { className: ["language-ts"] },
							children: [{ type: "text", value: "const x = 1;" }],
						},
					],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.children[0]?.type).toBe("code-block");
		expect(result.children[0]?.props.lang).toBe("ts");
		expect(result.children[0]?.props.value).toBe("const x = 1;");
	});

	it("filters out blocked tags like script", () => {
		const hast: HastRoot = {
			type: "root",
			children: [
				{
					type: "element",
					tagName: "script",
					properties: {},
					children: [{ type: "text", value: 'alert("xss")' }],
				},
				{
					type: "element",
					tagName: "p",
					properties: {},
					children: [{ type: "text", value: "Safe content" }],
				},
			],
		};

		const result = transformToIR(hast, mockFrontmatter, "/docs/test.md");

		expect(result.children).toHaveLength(1);
		expect(result.children[0]?.type).toBe("paragraph");
	});

	it("uses explicit slug from frontmatter", () => {
		const customSlugFrontmatter: FrontmatterData = {
			...mockFrontmatter,
			slug: "custom-slug",
		};

		const hast: HastRoot = { type: "root", children: [] };
		const result = transformToIR(hast, customSlugFrontmatter, "/docs/test.md");

		expect(result.slug).toBe("custom-slug");
	});

	it("computes slug from filepath when not in frontmatter", () => {
		const hastNoSlug: FrontmatterData = {
			title: "Test",
			description: "Test",
			tags: [],
		};

		const hast: HastRoot = { type: "root", children: [] };
		const result = transformToIR(hast, hastNoSlug, "/docs/api/methods.md");

		expect(result.slug).toBe("/docs/api/methods");
	});
});

describe("normalizeProps", () => {
	it("converts className array to class string", () => {
		const props = { className: ["btn", "primary"] };
		const result = normalizeProps(props);

		expect(result.class).toBe("btn primary");
		expect(result.className).toBeUndefined();
	});

	it("converts className string to class string", () => {
		const props = { className: "btn-primary" };
		const result = normalizeProps(props);

		expect(result.class).toBe("btn-primary");
	});

	it("converts style object to inline string", () => {
		const props = { style: { color: "red", fontSize: "14px" } };
		const result = normalizeProps(props);

		expect(result.style).toBe("color:red;fontSize:14px");
	});

	it("filters out null and undefined values", () => {
		const props = { id: "test", value: null, data: undefined, name: "foo" };
		const result = normalizeProps(props);

		expect(result.id).toBe("test");
		expect(result.name).toBe("foo");
		expect(result.value).toBeUndefined();
		expect(result.data).toBeUndefined();
	});

	it("preserves other properties unchanged", () => {
		const props = { id: "test", href: "/path", title: "Title" };
		const result = normalizeProps(props);

		expect(result.id).toBe("test");
		expect(result.href).toBe("/path");
		expect(result.title).toBe("Title");
	});

	it("handles empty properties object", () => {
		const result = normalizeProps({});
		expect(result).toEqual({});
	});

	it("handles undefined input", () => {
		const result = normalizeProps();
		expect(result).toEqual({});
	});

	it("filters undefined/null from style object values", () => {
		const props = {
			style: { color: "blue", margin: undefined, padding: null, border: "1px" },
		};
		const result = normalizeProps(props);

		expect(result.style).toBe("color:blue;border:1px");
	});
});
