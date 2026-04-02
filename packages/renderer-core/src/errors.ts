import type { IRNode } from "@docvia/ir";

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
