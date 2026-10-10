import type { ApiOperation, ApiSecurity } from "./model";
import { isAllowedTarget, isPrivateHost, PROXY_HEADER } from "./proxy";

/** Form values for a request, keyed by `paramKey(location, name)`. */
export type ParamValues = Record<string, string>;

export const paramKey = (location: string, name: string) =>
	`${location}:${name}`;

/** Prefers a server on the page's own origin: the only kind a browser can reach without CORS. */
export function defaultServer(
	op: ApiOperation,
	origin: string | undefined,
): string {
	const local = op.servers.find(
		(s) => s.url.startsWith("/") || (origin && s.url.startsWith(origin)),
	);
	return (local ?? op.servers[0])?.url ?? "";
}

/** A relative server URL (`/api/v1`) resolved against the page origin. */
export function resolveServerUrl(
	server: string,
	origin: string | undefined,
): string {
	return server.startsWith("/") && origin ? `${origin}${server}` : server;
}

/** The request URL with path parameters filled and query parameters appended; empty values are left out. */
export function buildRequestUrl(
	op: ApiOperation,
	server: string,
	values: ParamValues,
): string {
	const path = op.path.replace(/\{([^}]+)\}/g, (match, name: string) => {
		const value = values[paramKey("path", name)];
		return value ? encodeURIComponent(value) : match;
	});
	const query = new URLSearchParams();
	for (const p of op.parameters) {
		const value = values[paramKey("query", p.name)];
		if (p.in === "query" && value) query.append(p.name, value);
	}
	const search = query.toString();
	return `${server.replace(/\/$/, "")}${path}${search ? `?${search}` : ""}`;
}

/** Header parameters and credentials as `Headers`; an API key that goes in the query comes back in `query`. */
export function buildRequestHeaders(
	op: ApiOperation,
	values: ParamValues,
	auth: readonly ApiSecurity[],
	credentials: Readonly<Record<string, string>>,
	contentType: string | undefined,
): { headers: Headers; query: [string, string][] } {
	const headers = new Headers();
	const query: [string, string][] = [];
	for (const p of op.parameters) {
		const value = values[paramKey("header", p.name)];
		if (p.in === "header" && value) headers.set(p.name, value);
	}
	for (const scheme of auth) {
		const secret = credentials[scheme.name];
		if (!secret) continue;
		if (scheme.type === "apiKey" && scheme.paramName) {
			if (scheme.in === "query") query.push([scheme.paramName, secret]);
			else if (scheme.in === "header") headers.set(scheme.paramName, secret);
		} else if (
			scheme.type === "http" &&
			scheme.scheme?.toLowerCase() === "basic"
		) {
			// Typed as `user:password`.
			headers.set("Authorization", `Basic ${btoa(secret)}`);
		} else {
			headers.set("Authorization", `Bearer ${secret}`);
		}
	}
	if (contentType) headers.set("Content-Type", contentType);
	return { headers, query };
}

/** Names of required path, query and header parameters that have no value yet. */
export function missingParameters(
	op: ApiOperation,
	values: ParamValues,
): string[] {
	return op.parameters
		.filter(
			(p) => p.in !== "cookie" && p.required && !values[paramKey(p.in, p.name)],
		)
		.map((p) => p.name);
}

/** Re-indents a JSON response body; anything else is returned as is. */
export function prettyBody(text: string, contentType: string | null): string {
	if (!contentType?.includes("json")) return text;
	try {
		return JSON.stringify(JSON.parse(text), null, 2);
	} catch {
		return text;
	}
}

/** Where a request goes: straight to its own origin, through the docs site's proxy, or direct across origins. */
export type RequestRoute = "same-origin" | "proxy" | "direct";

export interface ProxyRoute {
	/** Same-origin path of a `createProxyHandler` endpoint, e.g. `/api-reference/proxy`. */
	readonly path: string;
	/** The servers that endpoint accepts. */
	readonly servers: readonly string[];
}

/** Picks the route for `url`: the proxy only for servers it accepts, so drafts to other hosts go direct. */
export function routeRequest(
	url: string,
	origin: string,
	proxy: ProxyRoute | undefined,
): { route: RequestRoute; fetchUrl: string } {
	const target = new URL(url, origin);
	if (target.origin === origin)
		return { route: "same-origin", fetchUrl: target.href };
	if (
		proxy &&
		isAllowedTarget(target, proxy.servers) &&
		!isPrivateHost(target.hostname)
	)
		return {
			route: "proxy",
			fetchUrl: `${proxy.path}?url=${encodeURIComponent(target.href)}`,
		};
	return { route: "direct", fetchUrl: target.href };
}

export interface SentResponse {
	readonly route: RequestRoute;
	readonly status: number;
	readonly statusText: string;
	readonly ms: number;
	/** Response size in bytes, after decoding. */
	readonly size: number;
	readonly headers: readonly [string, string][];
	readonly contentType: string | null;
	/** JSON re-indented; other text as received. */
	readonly body: string;
}

export interface FailedRequest {
	readonly route: RequestRoute;
	readonly error: string;
}

/** Sends a playground request by `routeRequest`, timing it and turning failures into readable errors. */
export async function sendRequest(
	request: { method: string; url: string; headers: Headers; body?: string },
	origin: string,
	proxy?: ProxyRoute,
	timeoutMs = 30_000,
): Promise<SentResponse | FailedRequest> {
	const { route, fetchUrl } = routeRequest(request.url, origin, proxy);
	const started = performance.now();
	let response: Response;
	try {
		response = await fetch(fetchUrl, {
			method: request.method,
			headers: request.headers,
			body:
				request.method === "GET" || request.method === "HEAD"
					? undefined
					: request.body || undefined,
			signal: AbortSignal.timeout(timeoutMs),
			credentials: route === "same-origin" ? "same-origin" : "omit",
		});
	} catch (err) {
		const timedOut = err instanceof DOMException && err.name === "TimeoutError";
		return {
			route,
			error: timedOut
				? `No response within ${timeoutMs / 1000} seconds.`
				: route === "direct"
					? "The request did not complete. The server may be down, or it does not allow requests from this site (CORS)."
					: "The request did not complete. The server may be down.",
		};
	}
	const text = await response.text();
	if (response.headers.get(PROXY_HEADER) === "error") {
		let message = text;
		try {
			message = (JSON.parse(text) as { message?: string }).message ?? text;
		} catch {
			// Not JSON: show the raw text.
		}
		return { route, error: `Proxy: ${message}` };
	}
	const contentType = response.headers.get("content-type");
	return {
		route,
		status: response.status,
		statusText: response.statusText,
		ms: Math.round(performance.now() - started),
		size: new TextEncoder().encode(text).byteLength,
		headers: [...response.headers.entries()].filter(
			([name]) => name !== PROXY_HEADER,
		),
		contentType,
		body: prettyBody(text, contentType),
	};
}
