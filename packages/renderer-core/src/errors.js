export class RenderError extends Error {
    code;
    node;
    constructor(code, message, node) {
        super(message);
        this.code = code;
        this.node = node;
        this.name = 'RenderError';
    }
}
