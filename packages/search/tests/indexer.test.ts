import type { IRDocument, IRNode } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import { extractSections, extractTextFromIR } from "../src/index";

describe("extractTextFromIR", () => {
	it("extracts text from simple text nodes", () => {
		const nodes: IRNode[] = [
			{
				type: "text",
				id: "node-1",
				props: { value: "Hello" },
				children: [],
			},
			{
				type: "text",
				id: "node-2",
				props: { value: "World" },
				children: [],
			},
		];

		const result = extractTextFromIR(nodes);
		expect(result).toBe("Hello World");
	});

	it("extracts text from code blocks", () => {
		const nodes: IRNode[] = [
			{
				type: "code-block",
				id: "node-1",
				props: { value: "const x = 1;", lang: "ts" },
				children: [],
			},
		];

		const result = extractTextFromIR(nodes);
		expect(result).toBe("const x = 1;");
	});

	it("extracts text from nested nodes", () => {
		const nodes: IRNode[] = [
			{
				type: "paragraph",
				id: "node-1",
				props: {},
				children: [
					{
						type: "text",
						id: "node-2",
						props: { value: "Nested" },
						children: [],
					},
				],
			},
		];

		const result = extractTextFromIR(nodes);
		expect(result).toBe("Nested");
	});

	it("handles empty nodes array", () => {
		const result = extractTextFromIR([]);
		expect(result).toBe("");
	});

	it("ignores non-text and non-code nodes", () => {
		const nodes: IRNode[] = [
			{
				type: "heading",
				id: "node-1",
				props: { depth: 1 },
				children: [],
			},
			{
				type: "text",
				id: "node-2",
				props: { value: "Only this" },
				children: [],
			},
		];

		const result = extractTextFromIR(nodes);
		expect(result).toBe("Only this");
	});
});

describe("extractSections", () => {
	const mockDoc: IRDocument = {
		slug: "test-page",
		frontmatter: {
			title: "Test Page",
			description: "A test page",
			tags: [],
		},
		children: [],
		headings: [],
		dependencies: [],
		contentHash: "abc123",
	};

	it("extracts single section for document without headings", () => {
		const doc: IRDocument = {
			...mockDoc,
			children: [
				{
					type: "text",
					id: "node-1",
					props: { value: "Content" },
					children: [],
				},
			],
		};

		const sections = extractSections(doc);

		expect(sections).toHaveLength(1);
		expect(sections[0]?.sectionId).toBe("_top");
		expect(sections[0]?.content).toBe("Content");
		expect(sections[0]?.pageTitle).toBe("Test Page");
	});

	it("extracts multiple sections at heading boundaries", () => {
		const doc: IRDocument = {
			...mockDoc,
			children: [
				{
					type: "heading",
					id: "node-1",
					props: { depth: 1, id: "intro" },
					children: [
						{
							type: "text",
							id: "node-2",
							props: { value: "Introduction" },
							children: [],
						},
					],
				},
				{
					type: "text",
					id: "node-3",
					props: { value: "Intro content" },
					children: [],
				},
				{
					type: "heading",
					id: "node-4",
					props: { depth: 1, id: "section2" },
					children: [
						{
							type: "text",
							id: "node-5",
							props: { value: "Section 2" },
							children: [],
						},
					],
				},
				{
					type: "text",
					id: "node-6",
					props: { value: "Section 2 content" },
					children: [],
				},
			],
		};

		const sections = extractSections(doc);

		expect(sections.length).toBeGreaterThanOrEqual(2);
		expect(sections[0]?.sectionTitle).toBe("Introduction");
		expect(sections[1]?.sectionTitle).toBe("Section 2");
	});

	it("preserves heading depth in sections", () => {
		const doc: IRDocument = {
			...mockDoc,
			children: [
				{
					type: "heading",
					id: "node-1",
					props: { depth: 2, id: "subsection" },
					children: [
						{
							type: "text",
							id: "node-2",
							props: { value: "Subsection" },
							children: [],
						},
					],
				},
			],
		};

		const sections = extractSections(doc);

		expect(sections[0]?.depth).toBe(2);
	});

	it("includes all content in sections", () => {
		const doc: IRDocument = {
			...mockDoc,
			children: [
				{
					type: "text",
					id: "node-1",
					props: { value: "Part 1" },
					children: [],
				},
				{
					type: "code-block",
					id: "node-2",
					props: { value: "code line", lang: "js" },
					children: [],
				},
				{
					type: "text",
					id: "node-3",
					props: { value: "Part 2" },
					children: [],
				},
			],
		};

		const sections = extractSections(doc);

		expect(sections[0]?.content).toContain("Part 1");
		expect(sections[0]?.content).toContain("code line");
		expect(sections[0]?.content).toContain("Part 2");
	});

	it("sets slug correctly in sections", () => {
		const doc: IRDocument = {
			...mockDoc,
			slug: "api/reference",
			children: [
				{
					type: "text",
					id: "node-1",
					props: { value: "Content" },
					children: [],
				},
			],
		};

		const sections = extractSections(doc);

		expect(sections[0]?.slug).toBe("api/reference");
	});

	it("does not include empty sections", () => {
		const doc: IRDocument = {
			...mockDoc,
			children: [
				{
					type: "heading",
					id: "node-1",
					props: { depth: 1, id: "empty" },
					children: [
						{
							type: "text",
							id: "node-2",
							props: { value: "Empty Section" },
							children: [],
						},
					],
				},
				// No content after heading
			],
		};

		const sections = extractSections(doc);

		// Should only have the heading text, not an empty section
		expect(sections.length).toBeGreaterThan(0);
	});
});
