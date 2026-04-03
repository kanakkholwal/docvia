import { parseMarkdown } from "@docvia/core";
import type { docviaConfig } from "@docvia/ir";
import { transformToIR } from "@docvia/ir";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";

export function docviaMarkdownPlugin(config: docviaConfig) {
	const renderer = config.renderer;
	if (!renderer) {
		throw new Error("[docvia] No renderer configured");
	}

	return {
		name: "docvia:markdown",

		async transform(code: string, id: string) {
			if (!id.endsWith(".md?docvia")) return null;

			const filePath = id.split("?")[0];
			if (!filePath) return null;
			const extracted = extractFrontmatter(code);
			const meta = validateFrontmatter(extracted.data, filePath);
			const { ast } = await parseMarkdown(extracted.content, {
				remarkPlugins: config.markdown.remarkPlugins,
			});
			const ir = transformToIR(ast, meta, filePath);
			const rendered = await renderer.renderPage(ir);

			return {
				code: rendered.code,
				map: (rendered.map as any) ?? null,
			};
		},
	};
}
