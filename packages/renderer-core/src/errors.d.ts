import type { IRNode } from "@dockit/ir";
export declare class RenderError extends Error {
    readonly code: string;
    readonly node: IRNode;
    constructor(code: string, message: string, node: IRNode);
}
//# sourceMappingURL=errors.d.ts.map