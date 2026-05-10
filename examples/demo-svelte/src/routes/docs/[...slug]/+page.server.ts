import { error } from "@sveltejs/kit";
import { docs } from "docvia/source";
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
