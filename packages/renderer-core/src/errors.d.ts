import type { IRNode } from "@docvia/ir";
export declare class RenderError extends Error {
    readonly code: string;
    readonly node: IRNode;
    constructor(code: string, message: string, node: IRNode);
}
