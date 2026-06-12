import { docs } from "virtual:docvia/source";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const slugs = params.slug?.split("/") || [];
	const page = await docs.getPage(slugs);

	if (!page) {
		throw error(404, "Page not found");
	}

	return {
		page,
	};
};
