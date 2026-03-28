import type { HeadingMeta } from '@dockit/ir';

export interface DockitPage {
    title: string;
    description?: string;
    slugs: string[];
    url: string;
    content: any;
    headings: HeadingMeta[];
    manifest: any;
}

export interface DockitPageMeta {
    slug: string;
    title: string;
    description?: string;
    headings: HeadingMeta[];
}

export interface DockitTreeNode {
    name: string;
    children: DockitTreeNode[];
    slug?: string;
    title?: string;
}

export interface DockitSourceInput {
    routes: Record<string, () => Promise<any>>;
    meta: DockitPageMeta[];
}

export interface DockitSource {
    getPage(slugs: string[]): Promise<DockitPage | null>;
    getTree(): DockitTreeNode[];
    getAllPages(): DockitPageMeta[];
}

export interface LoaderOptions {
    baseUrl?: string;
    source: DockitSourceInput;
}

export function loader({ baseUrl = '', source }: LoaderOptions): DockitSource {
    return {
        async getPage(slugs) {
            const key = slugs.join('/') || 'index';
            const loadModule = source.routes[key];

            if (!loadModule) return null;

            const mod = await loadModule();

            return {
                ...mod.meta,
                content: mod.content,
                slugs,
                url: `${baseUrl}/${key}`,
                headings: mod.meta.headings || [],
                manifest: mod.manifest,
            };
        },

        getTree() {
            return buildTree(source.meta);
        },

        getAllPages() {
            return source.meta;
        },
    };
}

function buildTree(meta: DockitPageMeta[]): DockitTreeNode[] {
    const tree: DockitTreeNode[] = [];

    for (const page of meta) {
        const parts = page.slug.split('/');
        let current = tree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]!;
            let node = current.find((n) => n.name === part);

            if (!node) {
                node = { name: part, children: [] };
                current.push(node);
            }

            if (i === parts.length - 1) {
                node.slug = page.slug;
                node.title = page.title;
            }

            current = node.children;
        }
    }

    return tree;
}

export type InferPageType<T> = T extends { getPage: (...args: any) => Promise<infer R> }
    ? R
    : never;
