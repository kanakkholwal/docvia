import { docs } from "virtual:docvia/source";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
	const tree = docs.pageTree;
	const pages = docs.getPages();

	const pagesMeta = pages.map((p) => ({
		slug: p.slugs.join("/") || "index",
		title: p.data?.title || p.slugs[p.slugs.length - 1] || "Home",
		description: p.data?.description || "",
	}));

	return {
		tree,
		pagesMeta,
	};
};
