import type { StandardSchemaV1 } from "@standard-schema/spec";
export type docviaErrorCode = "SCHEMA_ERROR" | "PARSE_ERROR" | "TRANSFORM_ERROR" | "RENDER_ERROR" | "PLUGIN_ERROR" | "CONFIG_ERROR" | "ASSET_ERROR";
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
export type IRNodeType = "heading" | "paragraph" | "text" | "emphasis" | "strong" | "code-block" | "inline-code" | "link" | "image" | "list" | "list-item" | "table" | "table-row" | "table-cell" | "blockquote" | "thematic-break" | "component" | "component-inline" | "element" | "unknown";
export type HydrationMode = "none" | "client:load" | "client:idle" | "client:visible";
export interface IRNode {
    readonly type: IRNodeType;
    readonly props: Readonly<Record<string, unknown>>;
    readonly children: readonly IRNode[];
    readonly id?: string;
}
export type Dependency = {
    readonly type: "file";
    readonly path: string;
} | {
    readonly type: "asset";
    readonly path: string;
} | {
    readonly type: "component";
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
/**
 * What a compiled page module exposes as `meta`. The built-in fields are typed;
 * the index signature carries every custom frontmatter key the user's schema
 * validated, which is what makes a configured `frontmatter` schema observable
 * at runtime rather than validated-then-discarded.
 *
 * `meta` is serialized with `JSON.stringify` by the renderer adapters, so the
 * values that survive here are JSON values — a schema that coerces to `Date`
 * lands as an ISO string. The generated frontmatter types model that (see
 * `Jsonify` in `@docvia/schema`); don't widen this to `Date` without also
 * changing how adapters emit it.
 */
export interface PageMeta {
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly headings: readonly HeadingMeta[];
    readonly contentHash: string;
    readonly lastModified: number;
    readonly tags: readonly string[];
    readonly draft?: boolean;
    readonly order?: number;
    readonly [key: string]: unknown;
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
    /**
     * Project root used for resolving relative paths and emitting the ambient
     * `docvia-env.d.ts`. Defaults to `process.cwd()` for backwards compatibility.
     */
    readonly projectRoot?: string;
    /**
     * Absolute path to the user's `docvia.config.*` file. When set, the generated
     * `types.d.ts` derives the `Frontmatter` type by importing this config and
     * inferring `config.frontmatter`'s output ({@link InferFrontmatter}) — precise
     * for any Standard Schema library. When absent, codegen falls back to a
     * permissive type.
     */
    readonly configPath?: string;
    /**
     * When true (default), the compiler reads/writes `.docvia.cache.json` and
     * skips files whose content hash and pipeline cache key match the previous
     * build. Pass `false` to force a full rebuild.
     */
    readonly incremental?: boolean;
}
export interface CompileResult {
    readonly pages: readonly PageMeta[];
    readonly searchIndex?: string;
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
export type HookPhase = "pre" | "normal" | "post";
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
 * A frontmatter validation schema from any [Standard Schema](https://standardschema.dev)
 * compliant library — Zod, Valibot, ArkType, etc. `@docvia/ir` depends only on
 * the spec's types (`@standard-schema/spec`, zero runtime), so no single
 * validation library is baked in.
 */
export type FrontmatterSchema = StandardSchemaV1<Record<string, unknown>, Record<string, unknown>>;
/**
 * Infer the validated output type of a frontmatter {@link FrontmatterSchema} —
 * for any Standard Schema library — through the schema's compile-time
 * `~standard.types`, with no runtime introspection. A convenience for
 * hand-written types; the generated `types.d.ts` inlines the same formula so it
 * carries no dependency to resolve. Falls back to a permissive record when `S`
 * is not a schema.
 */
export type InferFrontmatter<S> = S extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<S> : Record<string, unknown>;
export interface docviaConfig {
    readonly sourceDir: string;
    readonly outDir: string;
    readonly plugins: readonly docviaPlugin[];
    readonly renderer?: RendererAdapter;
    readonly components?: Record<string, ComponentConfig>;
    readonly collections?: readonly CollectionConfig[];
    /**
     * A [Standard Schema](https://standardschema.dev) to extend and validate
     * frontmatter fields beyond the built-in ones (title, description, tags,
     * draft, order, slug). Any compliant library works — Zod, Valibot, ArkType,
     * etc. The compiler layers it on top of the base schema, validates every
     * page at build time, and — when the schema is introspectable (Zod) —
     * generates a typed `Frontmatter` interface instead of the default
     * union-of-literal-values.
     *
     * @example
     * ```ts
     * import { z } from 'zod/v3';
     * export default defineConfig({
     *   frontmatter: z.object({
     *     author: z.string(),
     *     category: z.enum(['guide', 'reference']).optional(),
     *   }),
     * });
     * ```
     *
     * @example
     * ```ts
     * import * as v from 'valibot';
     * export default defineConfig({
     *   frontmatter: v.object({ author: v.optional(v.string()) }),
     * });
     * ```
     */
    readonly frontmatter?: FrontmatterSchema;
    readonly markdown: {
        readonly remarkPlugins: readonly unknown[];
    };
    readonly syntax: {
        readonly highlighter: "shiki" | "prism";
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
/**
 * Derive a {@link PageMeta} from a compiled {@link IRDocument} — the single
 * place that maps a document's frontmatter and headings to page metadata.
 * Shared by the build service, every renderer adapter, and the SSR service so
 * the shape stays consistent everywhere. `lastModified` is stamped at call time.
 */
/**
 * Project an IR document down to the `meta` a compiled page module exports.
 *
 * Custom frontmatter is spread first so every key the user's schema validated
 * survives to runtime; the derived fields then overwrite it, because `slug`,
 * `headings` and `contentHash` are computed from the document and must win over
 * anything the author wrote in the frontmatter block.
 */
export declare function toPageMeta(ir: IRDocument): PageMeta;
export { transformToIR } from "./transform";
