import type { HydrationMode, IRNode, PageMeta } from '@docvia/ir';
export type RenderOutput = {
    kind: 'element';
    tag: string;
    props?: Record<string, unknown>;
    children?: RenderOutput[];
    id?: string;
} | {
    kind: 'text';
    value: string;
} | {
    kind: 'html';
    value: string;
} | {
    kind: 'component';
    name: string;
    props?: Record<string, unknown>;
    children?: RenderOutput[];
    hydrate?: HydrationMode;
    id: string;
} | {
    kind: 'fragment';
    children: RenderOutput[];
};
export interface RenderContext {
    readonly slug: string;
    readonly meta: PageMeta;
    readonly registry: ComponentRegistry;
    readonly highlighter: SyntaxHighlighter;
    readonly manifest: HydrationManifest;
    readonly onError?: (err: RenderError) => void;
}
export type NodeRenderer = (node: IRNode, ctx: RenderContext) => Promise<RenderOutput>;
export interface RendererMap {
    [K: string]: NodeRenderer;
}
export interface ComponentRegistry {
    resolve(name: string): {
        component: unknown;
        hydrate?: boolean;
        defaultProps?: Record<string, unknown>;
    } | null;
}
export interface SyntaxHighlighter {
    highlight(code: string, lang: string): Promise<{
        html: string;
    }>;
}
export interface HydrationEntry {
    id: string;
    name: string;
    props: Record<string, unknown>;
    hydrate: HydrationMode;
}
export type HydrationManifest = HydrationEntry[];
import type { RenderError } from './errors';
