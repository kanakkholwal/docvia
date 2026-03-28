import { error } from '@sveltejs/kit';
import { dockitSource } from 'dockit:source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const slugs = params.slug?.split('/') || ['index'];
    const page = await dockitSource.collections.docs.getPage(slugs);

    if (!page) {
        throw error(404, 'Page not found');
    }

    return {
        page
    };
};
