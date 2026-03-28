import { error } from '@sveltejs/kit';
import { docs } from 'dockit:source';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const slugs = params.slug?.split('/') || ['index'];
    const page = await docs.getPage(slugs);

    if (!page) {
        throw error(404, 'Page not found');
    }

    return {
        page
    };
};
