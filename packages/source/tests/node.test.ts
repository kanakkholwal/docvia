import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadIRChunk } from "../src/node";

// Highlighting is irrelevant here — a stub keeps the test off the real Shiki.
const stubHighlighter = {
	highlight: async (code: string) => ({ html: `<pre>${code}</pre>` }),
};

const ir = {
	slug: "intro",
	frontmatter: {
		title: "Intro",
		description: "An intro",
		tags: ["a"],
		author: "Kanak",
	},
	children: [
		{
			type: "paragraph",
			id: "p1",
			props: {},
			children: [{ type: "text", props: { value: "Hello." }, children: [] }],
		},
	],
	headings: [{ depth: 1, text: "Intro", id: "intro" }],
	dependencies: [],
	contentHash: "hash-1",
};

let outDir: string;

beforeAll(async () => {
	outDir = await mkdtemp(join(tmpdir(), "docvia-source-"));
	await mkdir(join(outDir, "ir", "docs"), { recursive: true });
	await writeFile(
		join(outDir, "ir", "docs", "intro.json"),
		JSON.stringify(ir),
		"utf-8",
	);
});

afterAll(async () => {
	await rm(outDir, { recursive: true, force: true });
});

describe("loadIRChunk", () => {
	it("renders a pre-built IR chunk", async () => {
		const result = await loadIRChunk(outDir, "docs", "intro", {
			highlighter: stubHighlighter,
		});

		expect(result).toBeDefined();
		expect(result?.content.kind).toBe("fragment");
		expect(result?.meta.title).toBe("Intro");
		// Custom frontmatter fields survive into `meta`.
		expect(result?.meta.author).toBe("Kanak");
		expect(result?.meta.headings).toHaveLength(1);
		expect(result?.meta.contentHash).toBe("hash-1");
	});

	it("returns undefined when the chunk is missing", async () => {
		const result = await loadIRChunk(outDir, "docs", "does-not-exist", {
			highlighter: stubHighlighter,
		});
		expect(result).toBeUndefined();
	});
});
