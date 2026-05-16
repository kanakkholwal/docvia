// biome-ignore-all lint/suspicious/noExplicitAny: Shiki highlighter and rendered content shapes vary per renderer; typing them here would couple the loader to a single framework.
import fs from "node:fs/promises";
import { join } from "node:path";
import { parseMarkdown } from "@docvia/core";
import { transformToIR } from "@docvia/ir";
import {
	createDefaultRendererMap,
	renderDocument,
	type SyntaxHighlighter,
} from "@docvia/renderer-core";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";

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
			// shiki is an optional peer dependency — the surrounding try/catch
			// handles it not being installed at runtime.
			const { createHighlighter } = await import(/* @vite-ignore */ "shiki");
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

	const highlighter = options?.highlighter ?? (await getShikiHighlighter());

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

/**
 * Render a pre-built per-route IR chunk (emitted to `<outDir>/ir/` by the
 * docvia build). The chunk already has every docvia plugin applied — including
 * build-time syntax highlighting — so this is the consistent server-render
 * path for bundlers without a `?docvia` transform (Next.js / Turbopack).
 *
 * `options.highlighter` only highlights code blocks that were *not* already
 * pre-highlighted at build time (i.e. projects not using a highlighter plugin).
 */
export async function loadIRChunk(
	outDir: string,
	collection: string,
	slug: string,
	options?: { highlighter?: SyntaxHighlighter },
) {
	const chunkPath = join(outDir, "ir", collection, `${slug}.json`);
	let ir: any;
	try {
		ir = JSON.parse(await fs.readFile(chunkPath, "utf-8"));
	} catch {
		return undefined;
	}

	const highlighter = options?.highlighter ?? (await getShikiHighlighter());

	// Superset of frontmatter + page metadata: `data` keeps custom frontmatter
	// fields, and headings/contentHash are available for navigation.
	const meta = {
		...ir.frontmatter,
		slug: ir.slug,
		headings: ir.headings ?? [],
		contentHash: ir.contentHash,
		lastModified: Date.now(),
	};

	const { output, manifest } = await renderDocument(
		ir,
		createDefaultRendererMap(),
		{
			slug: ir.slug,
			meta: meta as any,
			registry: { resolve: () => null },
			highlighter,
		},
	);

	return { content: output, meta, manifest };
}
