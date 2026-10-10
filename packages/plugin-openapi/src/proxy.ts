export interface ProxyOptions {
	/** Absolute server URLs from the spec; a target must sit under one of them. */
	readonly servers: readonly string[];
	/** Largest request body forwarded. Default 1 MB. */
	readonly maxRequestBytes?: number;
	/** Largest response body returned. Default 5 MB. */
	readonly maxResponseBytes?: number;
	/** Upstream timeout. Default 30 s. */
	readonly timeoutMs?: number;
	/** For tests. */
	readonly fetch?: typeof fetch;
}

/** Header the proxy sets on every response it produced, upstream or its own error. */
export const PROXY_HEADER = "x-docvia-proxy";

const DROP_REQUEST = new Set([
	"host",
	"cookie",
	"origin",
	"referer",
	"connection",
	"keep-alive",
	"transfer-encoding",
	"upgrade",
	"te",
	"trailer",
	"content-length",
	"x-forwarded-for",
	"x-forwarded-host",
	"x-forwarded-proto",
	"x-real-ip",
]);
// fetch() already decoded the body, so the upstream encoding and length no longer describe it.
const DROP_RESPONSE = new Set([
	"set-cookie",
	"set-cookie2",
	"connection",
	"keep-alive",
	"transfer-encoding",
	"content-encoding",
	"content-length",
]);

/** Hosts a public docs site must never reach on a visitor's behalf. */
export function isPrivateHost(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (host.includes(":")) return isPrivateV6(host);
	// Single-label names only resolve on a local network; URL() already normalised numeric IPs.
	if (
		!host.includes(".") ||
		/(^|\.)(localhost|local|internal|home\.arpa)$/.test(host)
	)
		return true;
	const v4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
	if (v4) {
		const [a, b] = [Number(v4[1]), Number(v4[2])];
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			a >= 224
		);
	}
	return false;
}

function isPrivateV6(host: string): boolean {
	if (host === "::" || host === "::1") return true;
	const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
	if (mapped?.[1]) return isPrivateHost(mapped[1]);
	return /^(fc|fd|fe8|fe9|fea|feb)/.test(host);
}

/** Whether `target` is under one of `servers`: same origin, and inside the server's path. */
export function isAllowedTarget(
	target: URL,
	servers: readonly string[],
): boolean {
	return servers.some((server) => {
		let base: URL;
		try {
			base = new URL(server);
		} catch {
			return false;
		}
		if (base.origin !== target.origin) return false;
		const prefix = base.pathname.replace(/\/$/, "");
		return (
			target.pathname === prefix || target.pathname.startsWith(`${prefix}/`)
		);
	});
}

const failure = (status: number, code: string, message: string) =>
	new Response(JSON.stringify({ code, message }), {
		status,
		headers: { "content-type": "application/json", [PROXY_HEADER]: "error" },
	});

function capped(body: ReadableStream<Uint8Array>, max: number) {
	let seen = 0;
	return body.pipeThrough(
		new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, controller) {
				seen += chunk.byteLength;
				if (seen > max)
					controller.error(new Error(`Response is over ${max} bytes`));
				else controller.enqueue(chunk);
			},
		}),
	);
}

/**
 * A same-origin proxy for an API playground: `?url=` names the target, everything else is forwarded.
 * Only spec servers on public hosts are reachable; cookies never cross in either direction.
 */
export function createProxyHandler(options: ProxyOptions) {
	const maxRequest = options.maxRequestBytes ?? 1_000_000;
	const maxResponse = options.maxResponseBytes ?? 5_000_000;
	const timeout = options.timeoutMs ?? 30_000;
	const upstream = options.fetch ?? fetch;

	return async (request: Request): Promise<Response> => {
		const raw = new URL(request.url).searchParams.get("url");
		let target: URL;
		try {
			target = new URL(raw ?? "");
		} catch {
			return failure(400, "bad_url", "Pass the target as an absolute ?url=.");
		}
		if (target.protocol !== "https:" && target.protocol !== "http:")
			return failure(400, "bad_url", "Only http and https targets.");
		if (isPrivateHost(target.hostname))
			return failure(403, "private_host", `${target.hostname} is not public.`);
		if (!isAllowedTarget(target, options.servers))
			return failure(
				403,
				"not_allowed",
				`${target.origin} is not a server in this API's spec.`,
			);

		const headers = new Headers();
		for (const [name, value] of request.headers) {
			const lower = name.toLowerCase();
			if (
				!DROP_REQUEST.has(lower) &&
				!lower.startsWith("cf-") &&
				!lower.startsWith("proxy-") &&
				!lower.startsWith("sec-")
			)
				headers.set(name, value);
		}

		let body: ArrayBuffer | undefined;
		if (request.method !== "GET" && request.method !== "HEAD") {
			const declared = Number(request.headers.get("content-length") ?? 0);
			if (declared > maxRequest)
				return failure(
					413,
					"too_large",
					`Request body is over ${maxRequest} bytes.`,
				);
			body = await request.arrayBuffer();
			if (body.byteLength > maxRequest)
				return failure(
					413,
					"too_large",
					`Request body is over ${maxRequest} bytes.`,
				);
		}

		let response: Response;
		try {
			response = await upstream(target, {
				method: request.method,
				headers,
				body,
				redirect: "manual",
				signal: AbortSignal.timeout(timeout),
			});
		} catch (err) {
			const timedOut = err instanceof Error && err.name === "TimeoutError";
			return timedOut
				? failure(504, "timeout", `No response within ${timeout / 1000} s.`)
				: failure(502, "unreachable", `Could not reach ${target.origin}.`);
		}

		if (Number(response.headers.get("content-length") ?? 0) > maxResponse)
			return failure(
				502,
				"too_large",
				`Response is over ${maxResponse} bytes.`,
			);
		const out = new Headers();
		for (const [name, value] of response.headers)
			if (!DROP_RESPONSE.has(name.toLowerCase())) out.set(name, value);
		out.set(PROXY_HEADER, "1");
		return new Response(
			response.body ? capped(response.body, maxResponse) : null,
			{
				status: response.status,
				statusText: response.statusText,
				headers: out,
			},
		);
	};
}
