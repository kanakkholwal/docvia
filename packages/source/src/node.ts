import { parseMarkdown } from "@docvia/core";
import { transformToIR } from "@docvia/ir";
import {
	type SyntaxHighlighter,
	createDefaultRendererMap,
	renderDocument,
} from "@docvia/renderer-core";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";
import fs from "node:fs/promises";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

const defaultHighlighter: SyntaxHighlighter = {
	highlight: async (code: string) => ({
		html: `<pre><code>${escapeHtml(code)}</code></pre>`,
	}),
};

// Module-level cached Shiki highlighter (lazy-loaded)
let _shikiHighlighter: SyntaxHighlighter | null = null;

async function getShikiHighlighter(): Promise<SyntaxHighlighter> {
	if (_shikiHighlighter) return _shikiHighlighter;
	try {
		// @ts-ignore — shiki is an optional peer dependency
		const { createHighlighter } = await import("shiki");
		const instance = await createHighlighter({
			themes: ["github-dark"],
			langs: [
				"javascript",
				"typescript",
				"tsx",
				"jsx",
				"bash",
				"json",
				"css",
				"html",
				"svelte",
				"markdown",
			],
		});
		_shikiHighlighter = {
			highlight: async (code: string, lang: string) => {
				try {
					const html = instance.codeToHtml(code, {
						lang,
						theme: "github-dark",
					});
					return { html };
				} catch {
					return {
						html: `<pre><code>${escapeHtml(code)}</code></pre>`,
					};
				}
			},
		};
		return _shikiHighlighter;
	} catch {
		return defaultHighlighter;
	}
}

export async function loadMarkdown(
	filePath: string,
	options?: { highlighter?: SyntaxHighlighter },
) {
	const raw = await fs.readFile(filePath, "utf-8");
	const extracted = extractFrontmatter(raw);
	const meta = validateFrontmatter(extracted.data, filePath);
	const { ast } = await parseMarkdown(extracted.content);
	const ir = transformToIR(ast, meta, filePath);

	const highlighter =
		options?.highlighter ?? (await getShikiHighlighter());

	const { output, manifest } = await renderDocument(
		ir,
		createDefaultRendererMap(),
		{
			slug: ir.slug,
			meta: {
				slug: ir.slug,
				title: meta.title,
				description: meta.description,
				headings: ir.headings,
				contentHash: ir.contentHash,
				lastModified: Date.now(),
				tags: meta.tags,
				order: meta.order,
			} as any,
			registry: { resolve: () => null },
			highlighter,
		},
	);

	return {
		content: output,
		meta,
		manifest,
	};
}
