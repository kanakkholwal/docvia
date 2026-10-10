import { describe, expect, it } from "vitest";
import type { IRDocument } from "../../src/ir/index";
import { createModuleRenderer } from "../../src/render/module-renderer";

const doc: IRDocument = {
	slug: "intro",
	frontmatter: { title: "Intro", description: "", tags: [] },
	children: [
		{
			type: "paragraph",
			props: {},
			children: [{ type: "text", props: { value: "Hi" }, children: [] }],
		},
	],
	headings: [{ depth: 2, text: "Setup", id: "setup" }],
	dependencies: [],
	contentHash: "h1",
};

async function exportsOf(code: string): Promise<Record<string, unknown>> {
	return import(`data:text/javascript,${encodeURIComponent(code)}`);
}

describe("createModuleRenderer", () => {
	it("declares its runtime package", () => {
		const r = createModuleRenderer({ name: "x", runtimePackage: "@docvia/x" });
		expect(r.runtimePackages).toEqual(["@docvia/x"]);
	});

	it("emits meta, content and manifest", async () => {
		const r = createModuleRenderer({ name: "x", runtimePackage: "@docvia/x" });
		const mod = await exportsOf((await r.renderPage(doc)).code);
		expect(mod.meta).toMatchObject({ title: "Intro", headings: doc.headings });
		expect(mod.content).toMatchObject({ kind: "fragment" });
		expect(mod.manifest).toEqual([]);
	});

	it("runs the transform hook over the render tree", async () => {
		const r = createModuleRenderer(
			{ name: "x", runtimePackage: "@docvia/x" },
			{
				transform: (output) => ({
					kind: "element",
					tag: "article",
					children: [output],
				}),
			},
		);
		const mod = await exportsOf((await r.renderPage(doc)).code);
		expect(mod.content).toMatchObject({ kind: "element", tag: "article" });
	});
});
