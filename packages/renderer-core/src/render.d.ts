import type { IRDocument, IRNode } from "@docvia/ir";
import type { HydrationManifest, RenderContext, RendererMap, RenderOutput } from "./types";
export interface RenderResult {
    output: RenderOutput;
    manifest: HydrationManifest;
}
export declare function renderDocument(doc: IRDocument, map: RendererMap, ctx: Omit<RenderContext, "manifest">): Promise<RenderResult>;
export declare function renderNodes(nodes: readonly IRNode[], map: RendererMap, ctx: RenderContext): Promise<RenderOutput[]>;
