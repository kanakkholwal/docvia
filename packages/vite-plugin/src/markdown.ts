import { parseMarkdown } from '@dockit/core';
import type { DockitConfig } from '@dockit/ir';
import { transformToIR } from '@dockit/ir';
import { extractFrontmatter, validateFrontmatter } from '@dockit/schema';

export function dockitMarkdownPlugin(config: DockitConfig) {
    const renderer = config.renderer;
    if (!renderer) {
        throw new Error('[dockit] No renderer configured');
    }

    return {
        name: 'dockit:markdown',

        async transform(code: string, id: string) {
            if (!id.endsWith('.md?dockit')) return null;

            const filePath = id.split('?')[0];
            if (!filePath) return null;
            const extracted = extractFrontmatter(code);
            const meta = validateFrontmatter(extracted.data, filePath);
            const { ast } = await parseMarkdown(extracted.content, {
                remarkPlugins: config.markdown.remarkPlugins
            });
            const ir = transformToIR(ast, meta, filePath);
            const rendered = await renderer.renderPage(ir);

            return {
                code: rendered.code,
                map: (rendered.map as any) ?? null
            };
        }
    };
}
