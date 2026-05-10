declare module 'docvia/source' {
    const source: typeof import('./.docvia/source');
    export const docviaSource: typeof source.docviaSource;
    export const docs: typeof source.docs;

    export const registry: typeof source.registry;
}

declare module 'docvia/registry' {
    const mod: typeof import('./.docvia/registry');
    export const registry: typeof mod.registry;
}
