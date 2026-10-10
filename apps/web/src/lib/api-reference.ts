import api from "virtual:docvia/openapi";
import type {
	ApiOperationSummary,
	ProxyRoute,
} from "@docvia/plugin-openapi/source";

/** The sample API every /api-reference page and the proxy share. */
export const reference = api;

/** Absolute spec servers: the only hosts the same-origin proxy forwards to. */
export const proxyRoute: ProxyRoute = {
	path: "/api-reference/proxy",
	servers: api.index.servers
		.map((s) => s.url)
		.filter((url) => /^https?:\/\//.test(url)),
};

/** Where an operation's reading page lives in /docs, matching openapiSource({ dir: "api-example" }). */
export function docsUrl(
	op: Pick<ApiOperationSummary, "slug" | "tags">,
): string {
	const tag = api.index.tags.find((t) => t.name === op.tags[0]);
	return `/docs/api-example/${tag ? `${tag.slug}/` : ""}${op.slug}`;
}
