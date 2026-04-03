import { parseMarkdown } from "@docvia/core";
import { transformToIR } from "@docvia/ir";
import {
	createDefaultRendererMap,
	renderDocument,
} from "@docvia/renderer-core";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";
import fs from "node:fs/promises";

export async function loadMarkdown(filePath: string) {
	const raw = await fs.readFile(filePath, "utf-8");
	const extracted = extractFrontmatter(raw);
	const meta = validateFrontmatter(extracted.data, filePath);
	const { ast } = await parseMarkdown(extracted.content);
	const ir = transformToIR(ast, meta, filePath);

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
			highlighter: {
				highlight: async (code: string) => ({
					html: `<pre><code>${code}</code></pre>`,
				}),
			},
		},
	);

	return {
		content: output,
		meta,
		manifest,
	};
}
