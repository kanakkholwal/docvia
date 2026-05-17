import { redirect, type Handle } from "@sveltejs/kit";

/** The docs site lives on its own subdomain. */
const DOCS_ORIGIN = "https://docs.docvia.dev";

/**
 * Redirect `/docs` and `/docs/*` to the standalone docs site, stripping the
 * `/docs` prefix — `/docs/getting-started` → `https://docs.docvia.dev/getting-started`.
 * Any query string is preserved.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	if (pathname === "/docs" || pathname.startsWith("/docs/")) {
		const rest = pathname.slice("/docs".length); // "" or "/getting-started"
		redirect(301, `${DOCS_ORIGIN}${rest || "/"}${search}`);
	}

	return resolve(event);
};
