import { source } from "#lib/source.ts";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = () => ({
	tree: source.pageTree,
	pagesMeta: source.getPages().map((p) => ({
		slug: p.slugs.join("/") || "index",
		title: p.data.title,
		description: p.data.description,
	})),
});
