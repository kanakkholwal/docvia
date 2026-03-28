import { parseMarkdown } from '@dockit/core';
import type { DockitConfig } from '@dockit/ir';
import { transformToIR } from '@dockit/ir';

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
            const { ast } = await parseMarkdown(code, {
                remarkPlugins: config.markdown.remarkPlugins
            });

            // Minimal frontmatter handling for now (assuming it's already stripped or handled)
            // Actually, we should extract it here if needed, but the compiler already handles meta.json.
            // For the module itself, we need the content and manifest.

            const ir = transformToIR(ast, {} as any, filePath);
            const rendered = await renderer.renderPage(ir);

            return {
                code: rendered.code,
                map: (rendered.map as any) ?? null
            };
        }
    };
}
