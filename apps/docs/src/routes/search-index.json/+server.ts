import { buildSearchIndex } from "@docvia/search/node";
import type { RequestHandler } from "./$types";

// The Orama search index is built once, at build time, and served as a static
// JSON asset. `@docvia/search/node` compiles the docs in-process (driving a
// CompileService through the same pipeline as the build) and indexes the
// resulting IR — that compile touches the filesystem, so it is only legal at
// build time, hence this route is prerendered. The Cloudflare Worker then just
// serves the resulting `/search-index.json` static file.
export const prerender = true;

export const GET: RequestHandler = async () => {
	// `configPath` defaults to `docvia.config.ts` (resolved from the cwd, the app
	// root at build time); `collection` scopes the index to the "docs" collection
	// — pass a different name, or omit it, to index other sources.
	const index = await buildSearchIndex({ collection: "docs" });

	return new Response(index, {
		headers: {
			"content-type": "application/json",
			"cache-control": "public, max-age=3600",
		},
	});
};
