import { describe, expect, it } from "vitest";
import { createMarkdownStream, renderBlocks, toHtml } from "../src/index";

const streamed = (md: string) => {
	const stream = createMarkdownStream();
	for (const ch of md) stream.push(ch);
	return renderBlocks(stream.end().map((b) => b.node));
};

// Bugs reported against TanStack Markdown (#28, #29, #30), kept here so ours never regress.
describe("known parser pitfalls", () => {
	it("does not hang on Unicode line and paragraph separators", () => {
		expect(toHtml(">x\u2028")).toBe("<blockquote>\n<p>x</p>\n</blockquote>\n");
		for (const md of [">x\u2029", "- a\u2028\n- b", "# h\u2029"])
			expect(streamed(md)).toBe(toHtml(md));
	});

	it("keeps block quotes split by a blank line apart", () => {
		expect(toHtml("> foo\n\n> bar")).toBe(
			"<blockquote>\n<p>foo</p>\n</blockquote>\n<blockquote>\n<p>bar</p>\n</blockquote>\n",
		);
	});

	it("leaves spaced asterisks literal", () => {
		expect(toHtml("5 * 4 * 3 = 60")).toBe("<p>5 * 4 * 3 = 60</p>\n");
		expect(streamed("width * height * depth")).toBe(
			"<p>width * height * depth</p>\n",
		);
	});

	it("survives random input without throwing or stalling", () => {
		const alphabet = "*_`~[]()!<>#-+:|\\\n \t\u2028\u2029&;{}=.1aZ";
		let seed = 7;
		const rand = () => {
			seed = (seed * 1103515245 + 12345) % 2 ** 31;
			return seed / 2 ** 31;
		};
		for (let n = 0; n < 500; n++) {
			let md = "";
			for (let i = 0, len = 1 + Math.floor(rand() * 80); i < len; i++)
				md += alphabet[Math.floor(rand() * alphabet.length)];
			expect(streamed(md)).toBe(toHtml(md));
		}
	});
});
