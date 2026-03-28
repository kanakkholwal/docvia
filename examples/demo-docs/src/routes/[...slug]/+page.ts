
import { source } from '$lib/source';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const slug = params.slug || 'index';

    const page = await source.getPage(slug.split('/'));

    if (!page) {
        throw error(404, 'Page not found');
    }

    return {
        page
    };
};
