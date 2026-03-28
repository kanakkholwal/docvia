export type DockitErrorCode = 'SCHEMA_ERROR' | 'PARSE_ERROR' | 'TRANSFORM_ERROR' | 'RENDER_ERROR' | 'PLUGIN_ERROR' | 'CONFIG_ERROR' | 'ASSET_ERROR';
export declare class DockitError extends Error {
    readonly code: DockitErrorCode;
    readonly file?: string | undefined;
    readonly loc?: {
        readonly line: number;
        readonly column: number;
    } | undefined;
    readonly cause?: Error | undefined;
    readonly name = "DockitError";
    constructor(code: DockitErrorCode, message: string, file?: string | undefined, loc?: {
        readonly line: number;
        readonly column: number;
    } | undefined, cause?: Error | undefined);
}
export type IRNodeType = 'heading' | 'paragraph' | 'text' | 'emphasis' | 'strong' | 'code-block' | 'inline-code' | 'link' | 'image' | 'list' | 'list-item' | 'table' | 'table-row' | 'table-cell' | 'blockquote' | 'thematic-break' | 'component' | 'component-inline' | 'unknown';
export type HydrationMode = 'none' | 'client:load' | 'client:idle' | 'client:visible';
export interface IRNode {
    readonly type: IRNodeType;
    readonly props: Readonly<Record<string, unknown>>;
    readonly children: readonly IRNode[];
    readonly id?: string;
}
export type Dependency = {
    readonly type: 'file';
    readonly path: string;
} | {
    readonly type: 'asset';
    readonly path: string;
} | {
    readonly type: 'component';
    readonly name: string;
};
export interface HeadingMeta {
    readonly depth: number;
    readonly text: string;
    readonly id: string;
}
export interface FrontmatterData {
    readonly title: string;
    readonly description: string;
    readonly slug?: string;
    readonly tags: readonly string[];
    readonly draft?: boolean;
    readonly order?: number;
    readonly [key: string]: unknown;
}
export interface IRDocument {
    readonly slug: string;
    readonly frontmatter: FrontmatterData;
    readonly children: readonly IRNode[];
    readonly headings: readonly HeadingMeta[];
    readonly dependencies: readonly Dependency[];
    readonly contentHash: string;
}
export interface PageMeta {
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly headings: readonly HeadingMeta[];
    readonly contentHash: string;
    readonly lastModified: number;
    readonly tags: readonly string[];
    readonly order?: number;
}
export interface RenderedPage {
    readonly slug: string;
    readonly code: string;
    readonly contentHash: string;
    readonly map?: RawSourceMap;
    readonly assets?: readonly AssetReference[];
    readonly imports?: readonly string[];
}
export interface RawSourceMap {
    readonly version: number;
    readonly sources: readonly string[];
    readonly names: readonly string[];
    readonly mappings: string;
    readonly file?: string;
    readonly sourceRoot?: string;
    readonly sourcesContent?: readonly string[];
}
export interface AssetReference {
    readonly originalPath: string;
    readonly emittedPath: string;
    readonly hash: string;
}
export interface RendererAdapter {
    readonly name: string;
    renderPage(doc: IRDocument): Promise<RenderedPage>;
    renderManifest(pages: readonly PageMeta[]): Promise<string>;
}
export interface FileEntry {
    readonly path: string;
    readonly relativePath: string;
    readonly content: string;
    readonly hash: string;
}
export interface CompilerOptions {
    readonly sourceDir: string;
    readonly outDir: string;
    readonly renderer: RendererAdapter;
    readonly plugins: readonly DockitPlugin[];
    readonly config: DockitConfig;
}
export interface CompileResult {
    readonly pages: readonly PageMeta[];
    readonly searchIndex: string;
    readonly duration: number;
    readonly stats: {
        readonly total: number;
        readonly compiled: number;
        readonly cached: number;
    };
}
export interface CompilerCache {
    readonly fileHashes: ReadonlyMap<string, string>;
    readonly dependencies: ReadonlyMap<string, readonly string[]>;
    readonly outputs: ReadonlyMap<string, string>;
}
export interface DependencyGraph {
    readonly nodes: ReadonlyMap<string, DependencyNode>;
}
export interface DependencyNode {
    readonly filePath: string;
    readonly contentHash: string;
    readonly outputHash: string;
    readonly dependencies: readonly string[];
    readonly dependents: readonly string[];
    readonly lastCompiled: number;
}
export type HookPhase = 'pre' | 'normal' | 'post';
export interface DockitPlugin {
    readonly name: string;
    readonly version: string;
    readonly phase?: HookPhase;
    readonly priority?: number;
    cacheKey?(): string;
    beforeParse?(file: FileEntry): Promise<FileEntry> | FileEntry;
    afterParse?(ast: unknown, file: FileEntry): Promise<unknown> | unknown;
    beforeTransform?(ast: unknown, meta: FrontmatterData): Promise<unknown> | unknown;
    afterTransform?(doc: IRDocument): Promise<IRDocument> | IRDocument;
    beforeRender?(doc: IRDocument): Promise<IRDocument> | IRDocument;
}
export interface CollectionConfig {
    readonly name: string;
    readonly sourceDir: string;
    readonly baseUrl?: string;
}
export interface DockitConfig {
    readonly sourceDir: string;
    readonly outDir: string;
    readonly plugins: readonly DockitPlugin[];
    readonly renderer?: RendererAdapter;
    readonly collections?: readonly CollectionConfig[];
    readonly markdown: {
        readonly remarkPlugins: readonly unknown[];
    };
    readonly syntax: {
        readonly highlighter: 'shiki' | 'prism';
        readonly theme: string;
        readonly langs: readonly string[];
    };
    readonly theme: {
        readonly name: string;
        readonly options: Readonly<Record<string, unknown>>;
    };
}
export interface SearchDocument {
    readonly slug: string;
    readonly sectionId: string;
    readonly sectionTitle: string;
    readonly content: string;
    readonly depth: number;
    readonly pageTitle: string;
}
export { transformToIR } from './transform';
//# sourceMappingURL=index.d.ts.map