import type { IRNode } from "@dockit/ir";

export class RenderError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly node: IRNode
    ) {
        super(message);
        this.name = 'RenderError';
    }
}