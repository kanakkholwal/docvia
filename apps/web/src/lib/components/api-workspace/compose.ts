import {
	type ApiOperation,
	buildRequestHeaders,
	resolveServerUrl,
} from "@docvia/plugin-openapi/source";
import type { RequestState, Row } from "./workspace.svelte.ts";

const active = (rows: Row[]) => rows.filter((r) => r.enabled && r.name.trim());

/** The URL shown in the address bar: no credentials, unfilled path parameters left as `{name}`. */
export function displayUrl(
	request: RequestState,
	op: ApiOperation | undefined,
	origin: string | undefined,
): string {
	let base: string;
	if (op) {
		const path = op.path.replace(/\{([^}]+)\}/g, (match, name: string) => {
			const value = request.path.find((r) => r.name === name)?.value;
			return value ? encodeURIComponent(value) : match;
		});
		base = `${resolveServerUrl(request.url, origin).replace(/\/$/, "")}${path}`;
	} else {
		const url = request.url.trim();
		base =
			!url || /^[a-z]+:\/\//i.test(url) || url.startsWith("/")
				? url
				: `https://${url}`;
	}
	const query = active(request.query)
		.map((r) => `${encodeURIComponent(r.name)}=${encodeURIComponent(r.value)}`)
		.join("&");
	if (!query) return base;
	return `${base}${base.includes("?") ? "&" : "?"}${query}`;
}

/** Everything `sendRequest` needs: credentials applied where the operation's scheme puts them. */
export function composeRequest(
	request: RequestState,
	op: ApiOperation | undefined,
	origin: string,
	credentials: Readonly<Record<string, string>>,
): { method: string; url: string; headers: Headers; body?: string } {
	const url = new URL(displayUrl(request, op, origin), origin);
	let headers = new Headers();
	if (op) {
		const auth = op.security[Number(request.auth)] ?? [];
		const applied = buildRequestHeaders(op, {}, auth, credentials, undefined);
		headers = applied.headers;
		for (const [name, value] of applied.query)
			url.searchParams.append(name, value);
	}
	for (const r of active(request.headers)) headers.set(r.name.trim(), r.value);
	const hasBody =
		request.method !== "GET" &&
		request.method !== "HEAD" &&
		request.body.trim() !== "";
	if (hasBody && request.contentType && !headers.has("content-type"))
		headers.set("Content-Type", request.contentType);
	return {
		method: request.method,
		url: url.href,
		headers,
		body: hasBody ? request.body : undefined,
	};
}

/** Required parameters that are switched off or empty; the request cannot be sent without them. */
export function missingRequired(request: RequestState): string[] {
	return [...request.path, ...request.query, ...request.headers]
		.filter((r) => r.required && (!r.enabled || !r.value))
		.map((r) => r.name);
}
