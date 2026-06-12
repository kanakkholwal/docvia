declare module 'virtual:docvia/source' {
    const source: typeof import('./.docvia/source');
    export const docviaSource: typeof source.docviaSource;
    export const docs: typeof source.docs;

    export const registry: typeof source.registry;
}

declare module 'docvia/source' {
    const source: typeof import('./.docvia/source');
    export const docviaSource: typeof source.docviaSource;
    export const docs: typeof source.docs;

    export const registry: typeof source.registry;
}

declare module 'virtual:docvia/source/browser' {
    const browser: typeof import('./.docvia/browser');
    export const docviaSource: typeof browser.docviaSource;
    export const docs: typeof browser.docs;

    export const registry: typeof browser.registry;
}

declare module 'docvia/source/browser' {
    const browser: typeof import('./.docvia/browser');
    export const docviaSource: typeof browser.docviaSource;
    export const docs: typeof browser.docs;

    export const registry: typeof browser.registry;
}

declare module 'docvia/registry' {
    const mod: typeof import('./.docvia/registry');
    export const registry: typeof mod.registry;
}
