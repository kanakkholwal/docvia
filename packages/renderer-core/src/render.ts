import type { IRDocument, IRNode } from '@docvia/ir';
import { RenderError } from './errors';
import type { HydrationManifest, RenderContext, RenderOutput, RendererMap } from './types';

export interface RenderResult {
    output: RenderOutput;
    manifest: HydrationManifest;
}

export async function renderDocument(
    doc: IRDocument,
    map: RendererMap,
    ctx: Omit<RenderContext, 'manifest'>,
): Promise<RenderResult> {
    const manifest: HydrationManifest = [];
    const fullCtx: RenderContext = { ...ctx, manifest };
    const children = await renderNodes(doc.children, map, fullCtx);
    return {
        output: { kind: 'fragment', children },
        manifest,
    };
}

export async function renderNodes(
    nodes: readonly IRNode[],
    map: RendererMap,
    ctx: RenderContext,
): Promise<RenderOutput[]> {
    const fallbackRenderer = map.unknown;

    // Render all sibling nodes concurrently — they have no ordering dependency on each other
    const results = await Promise.all(
        nodes.map(async (node): Promise<RenderOutput> => {
            try {
                const renderer = map[node.type] ?? fallbackRenderer;
                if (!renderer) {
                    throw new Error(`No renderer for node type: ${node.type}`);
                }
                return await renderer(node, ctx);
            } catch (err) {
                const renderErr =
                    err instanceof RenderError
                        ? err
                        : new RenderError('UNKNOWN_NODE', String(err), node);
                ctx.onError?.(renderErr);
                return {
                    kind: 'element',
                    tag: 'div',
                    props: { class: 'docvia-render-error' },
                    children: [{ kind: 'text', value: `Render error: ${renderErr.message}` }],
                };
            }
        }),
    );

    // Register hydration entries in document order after all renders settle
    for (const output of results) {
        if (output.kind === 'component' && output.hydrate && output.hydrate !== 'none') {
            ctx.manifest.push({
                id: output.id,
                name: output.name,
                props: output.props ?? {},
                hydrate: output.hydrate,
            });
        }
    }

    return results;
}
