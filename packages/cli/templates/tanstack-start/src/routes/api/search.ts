import { createFromSource, createSearchHandler } from "@docvia/search";
import { createFileRoute } from "@tanstack/react-router";
import { source } from "~lib/source";

// Built on the first request, then reused for the life of the server instance.
let handler: Promise<(request: Request) => Promise<Response>> | undefined;

export const Route = createFileRoute("/api/search")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				handler ??= createFromSource(source).then(createSearchHandler);
				return (await handler)(request);
			},
		},
	},
});
