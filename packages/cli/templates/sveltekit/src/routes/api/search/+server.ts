import { createFromSource, createSearchHandler } from "@docvia/search";
import { source } from "~lib/source";
import type { RequestHandler } from "./$types";

// Built on the first request, then reused for the life of the server instance.
let handler: Promise<(request: Request) => Promise<Response>> | undefined;

export const GET: RequestHandler = async ({ request }) => {
	handler ??= createFromSource(source).then(createSearchHandler);
	return (await handler)(request);
};
