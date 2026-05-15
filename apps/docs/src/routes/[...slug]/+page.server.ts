import { error } from "@sveltejs/kit";
import { docs } from "docvia/source";
import type { EntryGenerator, PageServerLoad } from "./$types";

// Enumerate every doc slug so the prerenderer knows all [...slug] routes —
// the crawler can't discover rest-parameter routes on its own. An empty
// `slugs` array (the index page) joins to "", which maps to "/".
export const entries: EntryGenerator = () => {
	return docs.getPages().map((page) => ({ slug: page.slugs.join("/") }));
};

export const load: PageServerLoad = async ({ params }) => {
	const slugs = params.slug ? params.slug.split("/") : [];
	const page = await docs.getPage(slugs);

	if (!page) {
		throw error(404, "Page not found");
	}

	return { page };
};
