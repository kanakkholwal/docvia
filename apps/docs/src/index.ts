const TARGET_ORIGIN = "https://docvia.dev";
const TARGET_PREFIX = "/docs";

/**
 * The docs moved from `docs.docvia.dev/<path>` to `docvia.dev/docs/<path>`.
 * Every request is answered with a permanent redirect that preserves the path,
 * query string, and hash.
 */
export default {
	fetch(request: Request): Response {
		const url = new URL(request.url);
		const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
		const target = `${TARGET_ORIGIN}${TARGET_PREFIX}${path}${url.search}`;

		return new Response(null, {
			status: 301,
			headers: {
				location: target,
				// Old docs URLs are indexed; cache the hop at the edge for a day.
				"cache-control": "public, max-age=86400",
			},
		});
	},
} satisfies ExportedHandler;
