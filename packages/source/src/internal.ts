import type { DockitCollection, DockitSource } from './runtime';

export function createCollection(opts: {
    name: string;
    baseUrl: string;
    routes: Record<string, string>;
    meta: any[];
    nav: any;
    tags: Record<string, string[]>;
}): DockitCollection {
    const { baseUrl, routes, meta, nav, tags } = opts;

    async function loadModule(path: string) {
        // @ts-ignore - Vite will resolve this path relative to project root
        return import(/* @vite-ignore */ path);
    }

    return {
        async getPage(slugs) {
            const key = slugs?.join('/') || 'index';
            const path = routes[key];
            if (!path) return null;

            const mod = await loadModule(path);

            return {
                slug: key,
                slugs: slugs ?? [],
                url: baseUrl + (key === 'index' ? '' : '/' + key),
                data: mod.meta,
                content: mod.content,
                manifest: mod.manifest
            };
        },

        getAllPages() {
            // @ts-ignore
            return Object.keys(routes);
        },

        getTree() {
            return nav;
        },

        getPagesByTag(tag) {
            return tags[tag] ?? [];
        },

        getRelated(slug) {
            const page = meta.find((p: any) => p.slug === slug);
            if (!page?.tags) return [];

            const out = new Set<string>();
            for (const t of page.tags) {
                for (const s of tags[t] ?? []) {
                    if (s !== slug) out.add(s);
                }
            }
            return Array.from(out).slice(0, 5) as any[];
        }
    };
}

export function createSource(collections: Record<string, DockitCollection>): DockitSource {
    return { collections };
}
