import { createFromSource, createSearchHandler } from "@docvia/search";
import { source } from "~lib/source";

// Built on the first request, then reused for the life of the server instance.
let handler: Promise<(request: Request) => Promise<Response>> | undefined;

export async function GET(request: Request): Promise<Response> {
	handler ??= createFromSource(source).then(createSearchHandler);
	return (await handler)(request);
}
