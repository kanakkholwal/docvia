import type { Root as MdastRoot } from 'mdast';
export interface ParseOptions {
    readonly remarkPlugins?: readonly any[];
}
export interface ParseResult {
    readonly ast: MdastRoot;
}
export declare function parseMarkdown(content: string, options?: ParseOptions): Promise<ParseResult>;
//# sourceMappingURL=index.d.ts.map