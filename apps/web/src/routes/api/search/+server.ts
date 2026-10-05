import { createFromSource, createSearchHandler } from "@docvia/search";
import { source } from "#lib/source.ts";
import type { RequestHandler } from "./$types";

// Built once per Worker instance from compile-time `structuredData`: no filesystem, no index dump.
export const prerender = false;

let handler: Promise<(request: Request) => Promise<Response>> | null = null;

function getHandler() {
	if (!handler) {
		// Reset on failure so the next request retries instead of rejecting forever.
		handler = createFromSource(source)
			.then(createSearchHandler)
			.catch((err) => {
				handler = null;
				throw err;
			});
	}
	return handler;
}

export const GET: RequestHandler = async ({ request }) =>
	(await getHandler())(request);
