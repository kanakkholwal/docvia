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
    const out: RenderOutput[] = [];
    const fallbackRenderer = map.unknown;

    for (const node of nodes) {
        try {
            const renderer = map[node.type] ?? fallbackRenderer;
            if (!renderer) {
                throw new Error(`No renderer for node type: ${node.type}`);
            }

            const output = await renderer(node, ctx);

            // If it's a component node with hydration, track it in the manifest
            if (output.kind === 'component' && output.hydrate && output.hydrate !== 'none') {
                ctx.manifest.push({
                    id: output.id,
                    name: output.name,
                    props: output.props ?? {},
                    hydrate: output.hydrate,
                });
            }

            out.push(output);
        } catch (err) {
            const renderErr =
                err instanceof RenderError
                    ? err
                    : new RenderError('UNKNOWN_NODE', String(err), node);
            ctx.onError?.(renderErr);
            out.push({
                kind: 'element',
                tag: 'div',
                props: { class: 'docvia-render-error' },
                children: [{ kind: 'text', value: `Render error: ${renderErr.message}` }],
            });
        }
    }
    return out;
}
