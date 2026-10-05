import type { IRNode } from "@docvia/ir";
import { describe, expect, it, vi } from "vitest";
import { COPY_BUTTON_HTML, createDefaultRendererMap } from "../src/default-renderers";
import type { RenderContext } from "../src/types";

describe("default-renderers", () => {
	const mockHighlighter = {
		highlight: vi
			.fn()
			.mockResolvedValue({ html: "<pre><code>hello</code></pre>" }),
	};

	const ctx: RenderContext = {
		slug: "test",
		meta: {
			title: "Test",
			description: "Test description",
			slug: "test",
			headings: [],
			contentHash: "",
			lastModified: 0,
			tags: [],
		},
		registry: { resolve: vi.fn() },
		highlighter: mockHighlighter,
		manifest: [],
	};

	it("renders code-block as html kind", async () => {
		const renderers = createDefaultRendererMap();
		const node: IRNode = {
			type: "code-block",
			id: "node-1",
			props: { lang: "ts", value: "const x = 1;" },
			children: [],
		};

		const output = await renderers?.["code-block"]?.(node, ctx);

		expect(output?.kind).toBe("element");
		if (output?.kind === "element") {
			expect(output.tag).toBe("div");
			expect(output.props?.class).toBe("docvia-code-block");
			expect(output.children?.[0]?.kind).toBe("html");
			if (output.children?.[0]?.kind === "html") {
				expect(output.children?.[0]?.value).toBe(
					`<pre><code>hello</code></pre>${COPY_BUTTON_HTML}`,
				);
			}
		}
	});

	it("emits build-time highlighted HTML without calling the highlighter", async () => {
		const renderers = createDefaultRendererMap();
		const node: IRNode = {
			type: "code-block",
			id: "node-pre",
			props: {
				lang: "ts",
				value: "const x = 1;",
				html: '<pre class="shiki">prehighlighted</pre>',
			},
			children: [],
		};

		mockHighlighter.highlight.mockClear();
		const output = await renderers?.["code-block"]?.(node, ctx);

		expect(mockHighlighter.highlight).not.toHaveBeenCalled();
		expect(output?.kind).toBe("element");
		if (output?.kind === "element") {
			expect(output.props?.class).toBe("docvia-code-block");
			expect(output.children?.[0]?.kind).toBe("html");
			if (output.children?.[0]?.kind === "html") {
				expect(output.children[0].value).toBe(
					`<pre class="shiki">prehighlighted</pre>${COPY_BUTTON_HTML}`,
				);
			}
		}
	});

	it("renders inline-code as element kind", async () => {
		const renderers = createDefaultRendererMap();
		const node: IRNode = {
			type: "inline-code",
			id: "node-2",
			props: { value: "code" },
			children: [],
		};

		const output = await renderers?.["inline-code"]?.(node, ctx);
		expect(output?.kind).toBe("element");
		if (output?.kind === "element") {
			expect(output.tag).toBe("code");
			expect(output?.children?.[0]?.kind).toBe("text");
		}
	});

	it("gives every code block a copy button and a data-docvia-code hook", async () => {
		const renderers = createDefaultRendererMap();
		const plain = await renderers?.["code-block"]?.(
			{ type: "code-block", id: "n", props: { lang: "ts", value: "x" }, children: [] },
			{ ...ctx, highlighter: undefined },
		);
		expect(plain?.kind).toBe("element");
		if (plain?.kind === "element") {
			expect(plain.props?.["data-docvia-code"]).toBe("");
			expect(plain.children?.at(-1)).toEqual({ kind: "html", value: COPY_BUTTON_HTML });
		}
		expect(COPY_BUTTON_HTML).toContain("data-docvia-copy");
	});
});
