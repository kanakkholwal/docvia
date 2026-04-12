import type { Root as HastRoot } from "hast";
import type { FrontmatterData, IRDocument } from "./index";
export declare function transformToIR(ast: HastRoot, frontmatter: FrontmatterData, filePath: string): IRDocument;
export declare function normalizeProps(properties?: Record<string, unknown>): Record<string, unknown>;
