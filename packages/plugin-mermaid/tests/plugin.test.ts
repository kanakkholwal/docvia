import type { IRDocument, IRNode } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import { mermaid } from "../src/index";

function codeBlock(lang: string, value: string): IRNode {
	return { type: "code-block", id: "cb", props: { lang, value }, children: [] };
}

function doc(children: IRNode[]): IRDocument {
	return {
		slug: "test",
		frontmatter: { title: "Test", description: "", tags: [] },
		children,
		headings: [],
		dependencies: [],
		contentHash: "h",
	};
}

describe("@docvia/plugin-mermaid", () => {
	it("is a well-formed docvia plugin", () => {
		const plugin = mermaid();
		expect(plugin.name).toBe("@docvia/plugin-mermaid");
		expect(plugin.phase).toBe("pre");
		expect(typeof plugin.beforeRender).toBe("function");
	});

	it("rewrites a mermaid fence into a component node", async () => {
		const plugin = mermaid();
		const out = await plugin.beforeRender?.(
			doc([codeBlock("mermaid", "graph TD;\n  A-->B;\n")]),
		);

		const node = out?.children[0];
		expect(node?.type).toBe("component");
		expect(node?.id).toBe("cb");
		expect(node?.props.name).toBe("Mermaid");
		expect(node?.props.attributes).toMatchObject({ code: "graph TD;\n  A-->B;" });
	});

	it("reads a caption from a leading %% title: comment", async () => {
		const plugin = mermaid();
		const out = await plugin.beforeRender?.(
			doc([codeBlock("mermaid", "%% title: Build pipeline\ngraph TD;\n  A-->B;")]),
		);

		expect(out?.children[0]?.props.attributes).toMatchObject({
			title: "Build pipeline",
			code: "graph TD;\n  A-->B;",
		});
	});

	it("leaves the code alone when there is no title comment", async () => {
		const plugin = mermaid();
		const out = await plugin.beforeRender?.(
			doc([codeBlock("mermaid", "%% just a comment\ngraph TD;")]),
		);

		expect(out?.children[0]?.props.attributes).toMatchObject({
			code: "%% just a comment\ngraph TD;",
		});
	});

	it("leaves other languages alone", async () => {
		const plugin = mermaid();
		const out = await plugin.beforeRender?.(
			doc([codeBlock("ts", "const a = 1;")]),
		);

		expect(out?.children[0]?.type).toBe("code-block");
	});

	it("rewrites diagrams nested inside other nodes", async () => {
		const plugin = mermaid();
		const out = await plugin.beforeRender?.(
			doc([
				{
					type: "blockquote",
					props: {},
					children: [codeBlock("mermaid", "graph TD;")],
				},
			]),
		);

		expect(out?.children[0]?.children[0]?.type).toBe("component");
	});

	it("honours a custom fence tag and component name", async () => {
		const plugin = mermaid({ lang: "diagram", component: "Chart" });
		const out = await plugin.beforeRender?.(
			doc([codeBlock("diagram", "graph TD;")]),
		);

		expect(out?.children[0]?.props.name).toBe("Chart");
	});

	it("changes its cache key when options change", () => {
		expect(mermaid().cacheKey?.()).not.toBe(
			mermaid({ lang: "diagram" }).cacheKey?.(),
		);
	});
});
