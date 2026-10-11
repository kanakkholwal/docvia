import { describe, expect, it } from "vitest";
import { collapseStatic, toHtml } from "../../src/render/static-html";
import type { RenderOutput } from "../../src/render/types";

const prose: RenderOutput = {
	kind: "fragment",
	children: [
		{
			kind: "element",
			tag: "h2",
			props: { id: "usage" },
			id: "n1",
			children: [{ kind: "text", value: "Usage <tips>" }],
		},
		{
			kind: "element",
			tag: "p",
			children: [
				{ kind: "text", value: "See " },
				{
					kind: "element",
					tag: "a",
					props: { href: "/x?a=1&b=2" },
					children: [{ kind: "text", value: "docs" }],
				},
			],
		},
		{ kind: "component", name: "counter", id: "c1", props: { initial: 1 } },
		{ kind: "element", tag: "hr" },
	],
};

describe("toHtml", () => {
	it("escapes text and attributes and maps hast names", () => {
		expect(
			toHtml({
				kind: "element",
				tag: "code",
				props: { className: "x", dataLang: "ts", hidden: true, title: '"q"' },
				children: [{ kind: "text", value: "a<b" }],
			}),
		).toBe(
			'<code class="x" data-lang="ts" hidden title="&quot;q&quot;">a&lt;b</code>',
		);
	});
});

describe("collapseStatic", () => {
	it("gives each static element one html child (React-style)", () => {
		const out = collapseStatic(prose) as Extract<
			RenderOutput,
			{ kind: "fragment" }
		>;
		expect(out.children[0]).toEqual({
			kind: "element",
			tag: "h2",
			props: { id: "usage" },
			children: [{ kind: "html", value: "Usage &lt;tips&gt;" }],
		});
		expect(out.children[2]).toMatchObject({
			kind: "component",
			name: "counter",
		});
	});

	it("keeps overridable tags as nodes", () => {
		const out = collapseStatic(prose, { keepTags: ["a"] }) as Extract<
			RenderOutput,
			{ kind: "fragment" }
		>;
		const p = out.children[1] as Extract<RenderOutput, { kind: "element" }>;
		expect(p.children?.[1]).toMatchObject({ kind: "element", tag: "a" });
	});

	it("merges static siblings around components (Svelte-style)", () => {
		const out = collapseStatic(prose, { mergeSiblings: true }) as Extract<
			RenderOutput,
			{ kind: "fragment" }
		>;
		expect(out.children.map((c) => c.kind)).toEqual([
			"html",
			"component",
			"html",
		]);
		expect((out.children[0] as { value: string }).value).toBe(
			'<h2 id="usage">Usage &lt;tips&gt;</h2><p>See <a href="/x?a=1&amp;b=2">docs</a></p>',
		);
		expect((out.children[2] as { value: string }).value).toBe("<hr>");
	});

	it("keeps nested code blocks as nodes for codeBlock overrides", () => {
		const code: RenderOutput = {
			kind: "element",
			tag: "div",
			props: { class: "docvia-code-block", "data-docvia-code": "" },
			children: [{ kind: "html", value: "<pre>x</pre>" }],
		};
		const list: RenderOutput = {
			kind: "element",
			tag: "ul",
			children: [{ kind: "element", tag: "li", children: [code] }],
		};
		const out = collapseStatic(
			{ kind: "fragment", children: [list] },
			{ mergeSiblings: true },
		);
		expect(JSON.stringify(out)).toContain('"data-docvia-code":""');
	});
});
