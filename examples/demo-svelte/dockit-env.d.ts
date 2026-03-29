declare module 'dockit:source' {
    const source: typeof import('./.dockit/source');
    export const dockitSource: typeof source.dockitSource;
    export const docs: typeof source.docs;
}

declare module 'dockit:source/registry' {
    const registry: import('./.dockit/registry').registry;
    export { registry };
}
