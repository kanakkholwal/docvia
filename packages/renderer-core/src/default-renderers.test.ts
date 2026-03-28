import type { IRNode } from '@dockit/ir';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultRendererMap } from './default-renderers';
import type { RenderContext } from './types';

describe('default-renderers', () => {
    const mockHighlighter = {
        highlight: vi.fn().mockResolvedValue({ html: '<pre><code>hello</code></pre>' })
    };

    const ctx: RenderContext = {
        slug: 'test',
        meta: { title: 'Test', description: 'Test description', slug: 'test', headings: [], contentHash: '', lastModified: 0, tags: [] },
        registry: { resolve: vi.fn() },
        highlighter: mockHighlighter,
        manifest: [],
    };

    it('renders code-block as html kind', async () => {
        const renderers = createDefaultRendererMap();
        const node: IRNode = {
            type: 'code-block',
            id: 'node-1',
            props: { lang: 'ts', value: 'const x = 1;' },
            children: []
        };

        const output = await renderers?.['code-block']?.(node, ctx);

        expect(output?.kind).toBe('element');
        if (output?.kind === 'element') {
            expect(output.tag).toBe('div');
            expect(output.props?.class).toBe('dockit-code-block');
            expect(output.children?.[0]?.kind).toBe('html');
            if (output.children?.[0]?.kind === 'html') {
                expect(output.children?.[0]?.value).toBe('<pre><code>hello</code></pre>');
            }
        }
    });

    it('renders inline-code as element kind', async () => {
        const renderers = createDefaultRendererMap();
        const node: IRNode = {
            type: 'inline-code',
            id: 'node-2',
            props: { value: 'code' },
            children: []
        };

        const output = await renderers?.['inline-code']?.(node, ctx);
        expect(output?.kind).toBe('element');
        if (output?.kind === 'element') {
            expect(output.tag).toBe('code');
            expect(output?.children?.[0]?.kind).toBe('text');
        }
    });
});
