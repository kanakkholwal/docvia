import type { IRDocument, IRNode } from '@dockit/ir';
import type { HydrationManifest, RenderContext, RenderOutput, RendererMap } from './types';
export interface RenderResult {
    output: RenderOutput;
    manifest: HydrationManifest;
}
export declare function renderDocument(doc: IRDocument, map: RendererMap, ctx: Omit<RenderContext, 'manifest'>): Promise<RenderResult>;
export declare function renderNodes(nodes: readonly IRNode[], map: RendererMap, ctx: RenderContext): Promise<RenderOutput[]>;
//# sourceMappingURL=render.d.ts.map