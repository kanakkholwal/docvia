import { docs } from 'dockit:source';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    const nav = docs.getTree();
    const allPages = docs.getAllPages();

    // Fetch titles and descriptions for all pages to help with search or breadcrumbs
    const pagesMeta = await Promise.all(
        allPages.map(async (slug: string) => {
            const page = await docs.getPage(slug.split('/'));
            return {
                slug,
                title: page?.data?.title || slug,
                description: page?.data?.description || '',
            };
        })
    );

    return {
        nav,
        pagesMeta
    };
};
