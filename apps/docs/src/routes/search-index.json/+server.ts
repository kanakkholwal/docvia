import { buildSearchIndex } from "@docvia/search/node";
import type { RequestHandler } from "./$types";

// The Orama search index is built once, at build time, and served as a static
// JSON asset. `@docvia/search/node` reads the per-route IR chunks the docvia
// build emits and indexes them — that filesystem access is only legal at
// build time, so this route is prerendered. The Cloudflare Worker then just
// serves the resulting `/search-index.json` static file.
export const prerender = true;

export const GET: RequestHandler = async () => {
	// `outDir` defaults to `.docvia` (the docvia.config.ts default); `collection`
	// scopes the index to the "docs" collection — pass a different name, or omit
	// it, to index other sources.
	const index = await buildSearchIndex({ collection: "docs" });

	return new Response(index, {
		headers: {
			"content-type": "application/json",
			"cache-control": "public, max-age=3600",
		},
	});
};
