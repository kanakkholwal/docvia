import { describe, expect, it } from "vitest";
import { parse, toHtml } from "../src/index";

describe("GFM", () => {
	it("renders tables with alignment and escaped pipes", () => {
		expect(
			toHtml(String.raw`| a | b |
| :-- | --: |
| 1 | x \| y |
`),
		).toBe(
			'<table>\n<thead>\n<tr>\n<th align="left">a</th>\n<th align="right">b</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td align="left">1</td>\n<td align="right">x | y</td>\n</tr>\n</tbody>\n</table>\n',
		);
	});

	it("keeps a paragraph above a table and ends the table at a blank line", () => {
		const html = toHtml("intro\n| a |\n| - |\n| 1 |\n\nafter\n");
		expect(html).toContain("<p>intro</p>\n<table>");
		expect(html).toContain("</table>\n<p>after</p>");
	});

	it("does not treat a header with a different column count as a table", () => {
		expect(toHtml("| a | b |\n| - |\n")).not.toContain("<table>");
	});

	it("renders task list items, strikethrough and bare URLs", () => {
		expect(toHtml("- [x] done\n- [ ] todo\n")).toBe(
			'<ul>\n<li><input type="checkbox" disabled="" checked="" /> done</li>\n<li><input type="checkbox" disabled="" /> todo</li>\n</ul>\n',
		);
		expect(toHtml("~~gone~~ and ~one~")).toBe(
			"<p><del>gone</del> and <del>one</del></p>\n",
		);
		expect(toHtml("see https://example.com/a_(b). or www.example.com!")).toBe(
			'<p>see <a href="https://example.com/a_(b)">https://example.com/a_(b)</a>. or <a href="http://www.example.com">www.example.com</a>!</p>\n',
		);
	});
});

describe("docvia directives", () => {
	it("parses container, leaf and text directives with attributes", () => {
		const root = parse(
			':::callout{type=warning #note .wide}\nBe **careful**.\n:::\n\n::youtube{id="abc 1"}\n\nPress :kbd[Ctrl] now.\n',
		);
		expect(root.children[0]).toMatchObject({
			type: "directive",
			name: "callout",
			attributes: { type: "warning", id: "note", class: "wide" },
			children: [{ type: "paragraph" }],
		});
		expect(root.children[1]).toMatchObject({
			type: "directive",
			name: "youtube",
			attributes: { id: "abc 1" },
			children: [],
		});
		expect(root.children[2]).toMatchObject({
			type: "paragraph",
			children: [
				{ type: "text" },
				{
					type: "directive",
					name: "kbd",
					children: [{ type: "text", value: "Ctrl" }],
				},
				{ type: "text" },
			],
		});
	});

	it("renders directives through components, or as data-directive elements", () => {
		const md = ":::callout{type=tip}\nHi\n:::\n";
		expect(toHtml(md)).toBe(
			'<div data-directive="callout" type="tip"><p>Hi</p>\n</div>\n',
		);
		expect(
			toHtml(md, {
				directiveComponents: {
					callout: (n) =>
						`<aside class="${n.attributes.type}">${n.children}</aside>`,
				},
			}),
		).toBe('<aside class="tip"><p>Hi</p>\n</aside>\n');
	});

	it("leaves ordinary colons alone", () => {
		expect(toHtml("Time: 10:30, ratio a:b")).toBe(
			"<p>Time: 10:30, ratio a:b</p>\n",
		);
	});

	it("keeps code fence meta for highlighters", () => {
		expect(parse('```ts title="a.ts" {1,3}\nx\n```\n').children[0]).toEqual({
			type: "code",
			lang: "ts",
			meta: 'title="a.ts" {1,3}',
			value: "x\n",
		});
	});
});

describe("safety", () => {
	it("escapes raw HTML unless html is on", () => {
		expect(toHtml("<script>alert(1)</script>\n\nhi <b>x</b>")).toBe(
			"<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>\n<p>hi &lt;b&gt;x&lt;/b&gt;</p>\n",
		);
		expect(toHtml("hi <b>x</b>", { html: true })).toBe("<p>hi <b>x</b></p>\n");
	});

	it("drops unsafe URLs by default", () => {
		expect(
			toHtml(
				"[x](javascript:alert(1)) ![i](data:image/svg+xml,a) [ok](/docs) [m](mailto:a@b.c)",
			),
		).toBe(
			'<p><a href="">x</a> <img src="" alt="i" /> <a href="/docs">ok</a> <a href="mailto:a@b.c">m</a></p>\n',
		);
	});

	it("never lets an attribute name inject markup", () => {
		expect(toHtml(':::x{onclick="a" "><b}\n:::\n')).not.toContain("<b");
	});
});

describe("headings", () => {
	it("gives headings unique GitHub-style ids", () => {
		const ids = parse(
			"# Hello World\n## Hello World\n### Ünïcode & more!",
		).children.map((b) => (b.type === "heading" ? b.id : ""));
		expect(ids).toEqual(["hello-world", "hello-world-1", "ünïcode--more"]);
	});
});
