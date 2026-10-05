import { error } from "@sveltejs/kit";
import { source } from "~lib/source";
import type { EntryGenerator, PageServerLoad } from "./$types";

// Every page for the prerenderer, which cannot discover rest-parameter routes alone.
export const entries: EntryGenerator = () =>
	source.getPages().map((page) => ({ slug: page.slugs.join("/") }));

export const load: PageServerLoad = async ({ params }) => {
	const page = source.getPage(params.slug.split("/").filter(Boolean));
	if (!page) error(404, "Page not found");
	const { content, toc } = await page.data.load();
	return {
		title: page.data.title,
		description: page.data.description,
		content,
		toc,
	};
};
