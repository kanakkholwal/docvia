import { describe, expect, it } from "vitest";
import { defineConfig, type IRNode, PluginRunner } from "../../src/index";
import { markdownToIR } from "../../src/markdown/pipeline";
import { createModuleRenderer } from "../../src/render/index";

async function compile(markdown: string) {
	const { ir } = await markdownToIR({
		file: {
			path: "/docs/x.md",
			relativePath: "x.md",
			content: `---
title: X
---

${markdown}`,
			hash: "",
		},
		config: defineConfig({}),
		runner: new PluginRunner([]),
	});
	return ir;
}

const blocks = (nodes: readonly IRNode[], type: string): IRNode[] =>
	nodes.flatMap((n) => [
		...(n.type === type ? [n] : []),
		...blocks(n.children, type),
	]);

const fence = (lang: string, meta: string, body: string) =>
	`\`\`\`${lang} ${meta}\n${body}\n\`\`\`\n`;

describe("code blocks", () => {
	it("keeps fence titles", async () => {
		const ir = await compile(
			fence("ts", 'title="vite.config.ts"', "export {}"),
		);
		expect(blocks(ir.children, "code-block")[0]?.props).toMatchObject({
			lang: "ts",
			title: "vite.config.ts",
		});
	});

	it("groups adjacent tab fences", async () => {
		const ir = await compile(
			`${fence("tsx", 'tab="React"', "<A />")}\n${fence("svelte", 'tab="Svelte"', "<A />")}`,
		);
		const [group] = blocks(ir.children, "code-group");
		expect(group?.props.tabs).toEqual(["React", "Svelte"]);
		expect(group?.children).toHaveLength(2);
	});

	it("groups fences inside :::code-group", async () => {
		const ir = await compile(
			`:::code-group\n${fence("ts", 'title="a.ts"', "a")}\n${fence("js", "", "b")}:::\n`,
		);
		expect(blocks(ir.children, "code-group")[0]?.props.tabs).toEqual([
			"a.ts",
			"js",
		]);
	});

	it("expands npm fences into one tab per package manager", async () => {
		const ir = await compile(fence("npm", "", "npm i -D @docvia/cli"));
		const [group] = blocks(ir.children, "code-group");
		expect(group?.props.tabs).toEqual(["npm", "pnpm", "yarn", "bun"]);
		expect(group?.children.map((c) => c.props.value)).toEqual([
			"npm i -D @docvia/cli",
			"pnpm add -D @docvia/cli",
			"yarn add -D @docvia/cli",
			"bun add -D @docvia/cli",
		]);
	});

	it("renders tabs as accessible markup", async () => {
		const ir = await compile(fence("npm", "", "@docvia/cli"));
		const renderer = createModuleRenderer({ name: "t", runtimePackage: "t" });
		const { code } = await renderer.renderPage(ir);
		// Code blocks stay nodes for `codeBlock` overrides; the tab buttons are pre-rendered HTML.
		expect(code).toContain('"role":"tablist"');
		expect(code).toMatch(/role=\\"tab\\"/);
		expect(code).toContain("data-docvia-code-group");
		expect(code).toContain("pnpm add @docvia/cli");
	});
});
