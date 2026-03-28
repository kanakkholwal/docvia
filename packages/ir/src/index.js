// @dockit/ir — Intermediate Representation types, error system, and transforms
export class DockitError extends Error {
    code;
    file;
    loc;
    cause;
    name = 'DockitError';
    constructor(code, message, file, loc, cause) {
        super(message);
        this.code = code;
        this.file = file;
        this.loc = loc;
        this.cause = cause;
    }
}
export { transformToIR } from './transform';
