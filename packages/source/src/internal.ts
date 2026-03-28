import path from 'node:path';

import type { DockitCollection, DockitSource } from './runtime';

interface CollectionMetaEntry<TRouteKey extends string> {
    slug: TRouteKey;
    tags?: readonly string[];
}

export function createCollection<
    TFrontmatter = any,
    const TRoutes extends Record<string, string> = Record<string, string>,
>(
    opts: {
        name: string;
        baseUrl: string;
        routes: TRoutes;
        meta: CollectionMetaEntry<keyof TRoutes & string>[];
        nav: any;
        tags: Partial<Record<string, (keyof TRoutes & string)[]>>;
    },
): DockitCollection<TFrontmatter, keyof TRoutes & string> {
    const { baseUrl, routes, meta, nav, tags } = opts;

    async function loadModule(modulePath: string) {
        try {
            // @ts-ignore - Vite will resolve this path relative to project root
            return await import(/* @vite-ignore */ modulePath);
        } catch {
            const filePath = path.resolve(
                process.cwd(),
                modulePath.replace(/\?dockit$/, '').replace(/^\//, ''),
            );
            const { loadMarkdown } = await import('./node.js');
            return loadMarkdown(filePath);
        }
    }

    return {
        async getPage(slugs) {
            const normalizedSlugs = slugs?.filter(Boolean) ?? [];
            const key = (normalizedSlugs.join('/') || 'index') as keyof TRoutes & string;
            const modulePath = routes[key];
            if (!modulePath) return null;

            const mod = await loadModule(modulePath);

            return {
                slug: key,
                slugs: normalizedSlugs,
                url: baseUrl + (key === 'index' ? '' : `/${key}`),
                data: mod.meta as TFrontmatter,
                content: mod.content,
                manifest: mod.manifest,
            };
        },

        getAllPages() {
            return Object.keys(routes) as (keyof TRoutes & string)[];
        },

        getTree() {
            return nav;
        },

        getPagesByTag(tag) {
            return (tags[tag] ?? []) as (keyof TRoutes & string)[];
        },

        getRelated(slug) {
            const page = meta.find((entry) => entry.slug === slug);
            if (!page?.tags?.length) return [];

            const out = new Set<keyof TRoutes & string>();
            for (const tag of page.tags) {
                for (const relatedSlug of tags[tag] ?? []) {
                    if (relatedSlug !== slug) {
                        out.add(relatedSlug);
                    }
                }
            }
            return Array.from(out).slice(0, 5);
        },
    };
}

export function createSource<TCollections extends Record<string, DockitCollection<any, any>>>(
    collections: TCollections,
): DockitSource & { collections: TCollections } {
    return { collections };
}
