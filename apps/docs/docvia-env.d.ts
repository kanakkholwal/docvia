declare module 'docvia/source' {
    const source: typeof import('./.docvia/source');
    export const docviaSource: typeof source.docviaSource;
    export const docs: typeof source.docs;

}

