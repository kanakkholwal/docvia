import { createFromSource, createSearchHandler } from "@docvia/search";
import { docs } from "docvia/source";

// Headless, server-side search (Fumadocs-style). The Orama index is built once
// per server instance from the already-bundled docvia source — no filesystem,
// no compiler, no static index dump — and answers queries from this Route
// Handler. The docs pages stay statically generated; this route is dynamic.
export const dynamic = "force-dynamic";

// Build the index (and handler) lazily on first request, then reuse it for the
// life of the server instance.
let handler: Promise<(request: Request) => Promise<Response>> | null = null;
const getHandler = () =>
	// Clear the cache on failure so a transient build error doesn't wedge the
	// route into permanently rejecting — the next request retries.
	(handler ??= createFromSource(docs)
		.then(createSearchHandler)
		.catch((err) => {
			handler = null;
			throw err;
		}));

export async function GET(request: Request): Promise<Response> {
	return (await getHandler())(request);
}
