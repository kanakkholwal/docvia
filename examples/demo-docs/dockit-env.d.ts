declare module 'dockit:source' {
    import type { DockitCollection } from '@dockit/source';

    export const dockitSource: {
        collections: {
            docs: DockitCollection<import('./src/.dockit/collections/docs/types').Frontmatter,
                import('./src/.dockit/collections/docs/types').RouteKey>;
        }
    };

    export const docs: typeof dockitSource.collections.docs;
}
