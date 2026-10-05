import { error } from "@sveltejs/kit";
import { source } from "#lib/source.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

// Enumerate every doc slug so the prerenderer knows all [...slug] routes —
// the crawler can't discover rest-parameter routes on its own. An empty
// `slugs` array (the index page) joins to "", which maps to "/docs".
export const entries: EntryGenerator = () => {
	return source.getPages().map((page) => ({ slug: page.slugs.join("/") }));
};

const REPO = "https://github.com/kanakkholwal/docvia";

type PageLink = { title: string; url: string };

export const load: PageServerLoad = async ({ params }) => {
	const slugs = params.slug ? params.slug.split("/") : [];
	const page = source.getPage(slugs);
	if (!page) error(404, "Page not found");
	const { load, ...data } = page.data;
	const { content, headings } = await load();

	// Ordered pages drive the prev/next pager (getPages() is already sorted by
	// frontmatter order, then slug).
	const all = source.getPages();
	const key = slugs.join("/");
	const idx = all.findIndex((p) => p.slugs.join("/") === key);

	const toLink = (p: (typeof all)[number]): PageLink => ({
		title: p.data.title || (p.slugs.at(-1) ?? "Untitled"),
		url: p.url,
	});
	const prev = idx > 0 ? toLink(all[idx - 1]) : null;
	const next = idx >= 0 && idx < all.length - 1 ? toLink(all[idx + 1]) : null;

	// Resolve the slug back to its markdown source for an "Edit on GitHub" link.
	// A slug with descendants is a folder index (foo/index.md); otherwise a leaf.
	const isFolder = all.some(
		(p) =>
			p.slugs.length > slugs.length &&
			p.slugs.slice(0, slugs.length).join("/") === key,
	);
	const rel = slugs.length === 0 ? "index" : isFolder ? `${key}/index` : key;
	const editUrl = `${REPO}/edit/main/apps/web/src/docs/${rel}.md`;

	return { page: { data, content, headings }, prev, next, editUrl };
};
