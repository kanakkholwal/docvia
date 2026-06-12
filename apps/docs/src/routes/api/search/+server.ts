import { docs } from "virtual:docvia/source";
import { createFromSource, createSearchHandler } from "@docvia/search";
import type { RequestHandler } from "./$types";

// Headless, server-side search (Fumadocs-style). The Orama index is built once
// per server instance from the already-bundled docvia source — no filesystem,
// no compiler, no static index dump — so it runs in the Cloudflare Worker at
// request time. Most of the site is prerendered; this one route is dynamic.
export const prerender = false;

// Build the index (and handler) lazily on first request, then reuse it for the
// life of the worker instance. `createFromSource` walks every page's content,
// so we only want to pay for it once.
let handler: Promise<(request: Request) => Promise<Response>> | null = null;

function getHandler() {
	if (!handler) {
		handler = createFromSource(docs).then(createSearchHandler);
	}
	return handler;
}

export const GET: RequestHandler = async ({ request }) =>
	(await getHandler())(request);
