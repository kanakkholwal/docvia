import { parseMarkdown } from '@dockit/core';
import { transformToIR } from '@dockit/ir';
import { createDefaultRendererMap, renderDocument } from '@dockit/renderer-core';
import fs from 'node:fs/promises';

export async function loadMarkdown(filePath: string) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { ast } = await parseMarkdown(raw);

    // Minimal frontmatter handling for node fallback
    const meta = {};

    const ir = transformToIR(ast, meta as any, filePath);

    // Render with default renderers
    const { output, manifest } = await renderDocument(ir, createDefaultRendererMap(), {
        slug: filePath,
        meta: {
            slug: filePath,
            title: '',
            headings: [],
            contentHash: '',
            lastModified: Date.now()
        } as any,
        registry: { resolve: () => null },
        highlighter: { highlight: async (code: string) => ({ html: `<pre><code>${code}</code></pre>` }) }
    });

    return {
        content: output,
        meta,
        manifest
    };
}
