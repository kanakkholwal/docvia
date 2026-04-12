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

async function getShikiHighlighter(): Promise<SyntaxHighlighter> {
	// Reuse global singleton if already created by dynamic.ts or renderer adapter
	const g = globalThis as any;
	if (g.__docvia_shiki__) return g.__docvia_shiki__;
	if (g.__docvia_shiki_pending__) return g.__docvia_shiki_pending__;

	g.__docvia_shiki_pending__ = (async (): Promise<SyntaxHighlighter> => {
		try {
			// @ts-ignore — shiki is an optional peer dependency
			const { createHighlighter } = await import(
				/* @vite-ignore */ "shiki"
			);
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
			g.__docvia_shiki__ = {
				highlight: async (code: string, lang: string) => {
					try {
						return {
							html: instance.codeToHtml(code, {
								lang,
								theme: "github-dark",
							}),
						};
					} catch {
						return {
							html: `<pre><code>${escapeHtml(code)}</code></pre>`,
						};
					}
				},
			};
		} catch {
			g.__docvia_shiki__ = defaultHighlighter;
		}
		delete g.__docvia_shiki_pending__;
		return g.__docvia_shiki__;
	})();

	return g.__docvia_shiki_pending__;
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
