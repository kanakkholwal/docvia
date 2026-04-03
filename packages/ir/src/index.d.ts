export type docviaErrorCode = 'SCHEMA_ERROR' | 'PARSE_ERROR' | 'TRANSFORM_ERROR' | 'RENDER_ERROR' | 'PLUGIN_ERROR' | 'CONFIG_ERROR' | 'ASSET_ERROR';
export declare class docviaError extends Error {
    readonly code: docviaErrorCode;
    readonly file?: string | undefined;
    readonly loc?: {
        readonly line: number;
        readonly column: number;
    } | undefined;
    readonly cause?: Error | undefined;
    readonly name = "docviaError";
    constructor(code: docviaErrorCode, message: string, file?: string | undefined, loc?: {
        readonly line: number;
        readonly column: number;
    } | undefined, cause?: Error | undefined);
}
export type IRNodeType = 'heading' | 'paragraph' | 'text' | 'emphasis' | 'strong' | 'code-block' | 'inline-code' | 'link' | 'image' | 'list' | 'list-item' | 'table' | 'table-row' | 'table-cell' | 'blockquote' | 'thematic-break' | 'component' | 'component-inline' | 'element' | 'unknown';
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
    readonly plugins: readonly docviaPlugin[];
    readonly config: docviaConfig;
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
export interface docviaPlugin {
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
export interface ComponentConfig {
    readonly path: string;
    readonly hydrate?: boolean;
    readonly defaultProps?: Record<string, unknown>;
}
export interface CollectionConfig {
    readonly name: string;
    readonly sourceDir: string;
    readonly baseUrl?: string;
}
/**
 * Duck-typed interface compatible with `z.ZodObject<any>`.
 * Allows @docvia/ir to remain free of a zod dependency.
 */
export interface FrontmatterSchema {
    safeParse(data: unknown): {
        success: true;
        data: Record<string, unknown>;
    } | {
        success: false;
        error: {
            issues: ReadonlyArray<{
                path: ReadonlyArray<string | number>;
                message: string;
            }>;
        };
    };
    readonly shape: Readonly<Record<string, unknown>>;
}
export interface docviaConfig {
    readonly sourceDir: string;
    readonly outDir: string;
    readonly plugins: readonly docviaPlugin[];
    readonly renderer?: RendererAdapter;
    readonly components?: Record<string, ComponentConfig>;
    readonly collections?: readonly CollectionConfig[];
    /**
     * Zod schema to extend and validate frontmatter fields beyond the built-in
     * (title, description, tags, draft, order, slug). Pass a `z.object({...})`
     * and the compiler will merge it with the base schema, validate all pages
     * at build time, and generate a typed `Frontmatter` interface instead of
     * the default union-of-literal-values.
     *
     * @example
     * ```ts
     * import { z } from 'zod/3';
     * export default defineConfig({
     *   frontmatter: z.object({
     *     author: z.string(),
     *     category: z.enum(['guide', 'reference']).optional(),
     *   }),
     * });
     * ```
     */
    readonly frontmatter?: FrontmatterSchema;
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
