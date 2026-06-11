declare module 'virtual:docvia/source' {
    const source: typeof import('./.docvia/source');
    export const docviaSource: typeof source.docviaSource;
    export const docs: typeof source.docs;

}

declare module 'docvia/source' {
    const source: typeof import('./.docvia/source');
    export const docviaSource: typeof source.docviaSource;
    export const docs: typeof source.docs;

}

declare module 'virtual:docvia/source/browser' {
    const browser: typeof import('./.docvia/browser');
    export const docviaSource: typeof browser.docviaSource;
    export const docs: typeof browser.docs;

}

declare module 'docvia/source/browser' {
    const browser: typeof import('./.docvia/browser');
    export const docviaSource: typeof browser.docviaSource;
    export const docs: typeof browser.docs;

}


