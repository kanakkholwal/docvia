import { RenderError } from './errors';
export async function renderDocument(doc, map, ctx) {
    const manifest = [];
    const fullCtx = { ...ctx, manifest };
    const children = await renderNodes(doc.children, map, fullCtx);
    return {
        output: { kind: 'fragment', children },
        manifest,
    };
}
export async function renderNodes(nodes, map, ctx) {
    const out = [];
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
        }
        catch (err) {
            const renderErr = err instanceof RenderError
                ? err
                : new RenderError('UNKNOWN_NODE', String(err), node);
            ctx.onError?.(renderErr);
            out.push({
                kind: 'element',
                tag: 'div',
                props: { class: 'dockit-render-error' },
                children: [{ kind: 'text', value: `Render error: ${renderErr.message}` }],
            });
        }
    }
    return out;
}
