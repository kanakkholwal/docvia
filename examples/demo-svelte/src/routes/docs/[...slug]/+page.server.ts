import { error } from "@sveltejs/kit";
import { source } from "#lib/source.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const page = source.getPage(params.slug?.split("/").filter(Boolean));
	if (!page) error(404, "Page not found");
	const { content, headings } = await page.data.load();
	return { page: { title: page.data.title, content, headings } };
};
