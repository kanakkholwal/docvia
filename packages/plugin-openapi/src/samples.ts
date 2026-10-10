import { snippetz } from "@scalar/snippetz";
import type { ApiCodeSample, ApiMethod, ApiSecurity } from "./model";

// Targets are user strings, checked with hasPlugin() before printing.
type PrintArgs = Parameters<ReturnType<typeof snippetz>["print"]>;

/** A `snippetz` target and client, e.g. `{ target: "shell", client: "curl" }`. */
export interface SampleTarget {
	readonly target: string;
	readonly client: string;
	readonly label: string;
	/** Highlighter language of the output. */
	readonly lang: string;
}

export const DEFAULT_SAMPLES: readonly SampleTarget[] = [
	{ target: "shell", client: "curl", label: "cURL", lang: "bash" },
	{ target: "js", client: "fetch", label: "JavaScript", lang: "js" },
	{ target: "python", client: "requests", label: "Python", lang: "python" },
	{ target: "go", client: "native", label: "Go", lang: "go" },
];

export interface SampleRequest {
	readonly method: ApiMethod;
	readonly url: string;
	readonly query: ReadonlyArray<{ name: string; value: string }>;
	readonly headers: ReadonlyArray<{ name: string; value: string }>;
	readonly body?: { mediaType: string; value: unknown };
}

/** Placeholder credentials per scheme, so samples show where auth goes. */
export function withAuth(
	request: SampleRequest,
	auth: readonly ApiSecurity[] | undefined,
): SampleRequest {
	const headers = [...request.headers];
	const query = [...request.query];
	for (const scheme of auth ?? []) {
		if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "basic")
			headers.push({ name: "Authorization", value: "Basic <credentials>" });
		else if (
			scheme.type === "http" ||
			scheme.type === "oauth2" ||
			scheme.type === "openIdConnect"
		)
			headers.push({ name: "Authorization", value: "Bearer <token>" });
		else if (scheme.type === "apiKey" && scheme.paramName) {
			const entry = { name: scheme.paramName, value: "<api-key>" };
			if (scheme.in === "query") query.push(entry);
			else if (scheme.in === "header") headers.push(entry);
		}
	}
	return { ...request, headers, query };
}

const stringify = (value: unknown) =>
	typeof value === "string" ? value : JSON.stringify(value);

function toHar(request: SampleRequest) {
	const search = new URLSearchParams(
		request.query.map((q) => [q.name, q.value]),
	).toString();
	const headers = [...request.headers];
	let postData:
		| {
				mimeType: string;
				text?: string;
				params?: { name: string; value: string }[];
		  }
		| undefined;
	const body = request.body;
	if (body) {
		headers.push({ name: "Content-Type", value: body.mediaType });
		const form =
			body.mediaType === "application/x-www-form-urlencoded" ||
			body.mediaType.startsWith("multipart/");
		postData =
			form && typeof body.value === "object" && body.value !== null
				? {
						mimeType: body.mediaType,
						params: Object.entries(body.value).map(([name, value]) => ({
							name,
							value: stringify(value),
						})),
					}
				: {
						mimeType: body.mediaType,
						text:
							typeof body.value === "string"
								? body.value
								: JSON.stringify(body.value, null, 2),
					};
	}
	return {
		method: request.method,
		url: search ? `${request.url}?${search}` : request.url,
		headers,
		postData,
	};
}

export function codeSamples(
	request: SampleRequest,
	targets: readonly SampleTarget[],
): ApiCodeSample[] {
	const printer = snippetz();
	const har = toHar(request);
	const out: ApiCodeSample[] = [];
	for (const t of targets) {
		const code = printer.hasPlugin(t.target, t.client)
			? printer.print(...([t.target, t.client, har] as unknown as PrintArgs))
			: undefined;
		if (code)
			out.push({
				id: `${t.target}-${t.client}`,
				label: t.label,
				lang: t.lang,
				code,
			});
	}
	return out;
}
