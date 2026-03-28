declare module 'dockit:source' {
    import type { DockitCollection } from '@dockit/source/runtime';

    export const dockitSource: {
        collections: {
            docs: DockitCollection<import('./.dockit/collections/docs/types').Frontmatter, import('./.dockit/collections/docs/types').RouteKey>;
        };
    };

    export const docs: typeof dockitSource.collections.docs;
}
