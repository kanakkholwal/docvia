import type { IRDocument, IRNode } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import { shiki } from "../src/index";

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

/** Find the first `code-block` node anywhere in an IR tree. */
function findCodeBlock(nodes: readonly IRNode[]): IRNode | undefined {
	for (const node of nodes) {
		if (node.type === "code-block") return node;
		const nested = findCodeBlock(node.children);
		if (nested) return nested;
	}
	return undefined;
}

describe("@docvia/plugin-shiki", () => {
	it("is a well-formed docvia plugin", () => {
		const plugin = shiki();
		expect(plugin.name).toBe("@docvia/plugin-shiki");
		expect(plugin.version).toBeTruthy();
		expect(typeof plugin.beforeRender).toBe("function");
	});

	it("embeds highlighted HTML on code-block nodes", {
		timeout: 30000,
	}, async () => {
		const plugin = shiki();
		const result = await plugin.beforeRender?.(
			doc([codeBlock("typescript", "const x: number = 1;")]),
		);
		const block = findCodeBlock(result!.children);

		expect(typeof block?.props.html).toBe("string");
		const html = block?.props.html as string;
		expect(html).toContain("<pre");
		expect(html).toContain("shiki");
		// Original code text survives into the highlighted markup.
		expect(html).toContain("const");
	});

	it("highlights code blocks nested inside other nodes", {
		timeout: 30000,
	}, async () => {
		const plugin = shiki();
		const nested: IRNode = {
			type: "blockquote",
			id: "bq",
			props: {},
			children: [codeBlock("json", '{"a":1}')],
		};
		const result = await plugin.beforeRender?.(doc([nested]));
		const block = findCodeBlock(result!.children);

		expect(typeof block?.props.html).toBe("string");
	});

	it("falls back to plain text for un-preloaded languages", {
		timeout: 30000,
	}, async () => {
		const plugin = shiki({ langs: ["javascript"] });
		const result = await plugin.beforeRender?.(
			doc([codeBlock("cobol", "DISPLAY 'HI'.")]),
		);
		const block = findCodeBlock(result!.children);

		const html = block?.props.html as string;
		expect(html).toContain("<pre");
		// HTML-escaped fallback, not a thrown error.
		expect(html).toContain("DISPLAY");
	});

	it("derives a cache key that changes with the theme", () => {
		expect(shiki({ theme: "github-dark" }).cacheKey?.()).toBe(
			shiki({ theme: "github-dark" }).cacheKey?.(),
		);
		expect(shiki({ theme: "github-dark" }).cacheKey?.()).not.toBe(
			shiki({ theme: "github-light" }).cacheKey?.(),
		);
	});
});
