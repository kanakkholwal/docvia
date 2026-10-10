import { micromark } from "micromark";
import type {
	ApiContent,
	ApiDocument,
	ApiExample,
	ApiMethod,
	ApiOperation,
	ApiParameter,
	ApiResponse,
	ApiSecurity,
	ApiServer,
	ApiTag,
	Html,
} from "./model";
import {
	codeSamples,
	DEFAULT_SAMPLES,
	type SampleRequest,
	type SampleTarget,
	withAuth,
} from "./samples";
import {
	declaredExample,
	deref,
	type SchemaContext,
	sampleValue,
	toApiSchema,
} from "./schema";
import {
	HTTP_METHODS,
	type OpenAPIDocument,
	type OpenAPIServer,
} from "./types";

type Raw = Record<string, unknown>;

export interface BuildOptions {
	/** Highlights examples and code samples; its HTML lands on each `html` field. */
	readonly highlight?: (code: string, lang: string) => string | Promise<string>;
	/** Code sample languages, in tab order. Defaults to cURL, JavaScript, Python and Go. */
	readonly samples?: readonly SampleTarget[];
}

const isObject = (value: unknown): value is Raw =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const slugify = (text: string) =>
	text
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "") || "operation";

function markdown(text: unknown): Html | undefined {
	if (typeof text !== "string" || !text.trim()) return undefined;
	return micromark(text.trim());
}

function servers(list: readonly OpenAPIServer[] | undefined): ApiServer[] {
	return (list ?? []).map((server) => ({
		url: server.url.replace(
			/\{(\w+)\}/g,
			(match, name: string) => server.variables?.[name]?.default ?? match,
		),
		description: server.description,
	}));
}

function langOf(mediaType: string): string {
	if (/json/.test(mediaType)) return "json";
	if (/xml/.test(mediaType)) return "xml";
	if (/ya?ml/.test(mediaType)) return "yaml";
	if (/html/.test(mediaType)) return "html";
	return "text";
}

const format = (value: unknown, lang: string) =>
	typeof value === "string" && lang !== "json"
		? value
		: JSON.stringify(value, null, 2);

function contents(
	ctx: SchemaContext,
	content: unknown,
	mode: "request" | "response",
): ApiContent[] {
	if (!isObject(content)) return [];
	return Object.entries(content).map(([mediaType, raw]) => {
		const media = isObject(raw) ? raw : {};
		const lang = langOf(mediaType);
		const named = isObject(media.examples)
			? Object.entries(media.examples).map(([key, example]) => {
					const resolved = deref(ctx.doc, example).schema;
					return {
						label:
							typeof resolved.summary === "string" ? resolved.summary : key,
						value: resolved.value,
					};
				})
			: [];
		const values =
			named.length > 0
				? named
				: [
						{
							label: "Example",
							value: media.example ?? sampleValue(ctx.doc, media.schema, mode),
						},
					];
		return {
			mediaType,
			schema:
				media.schema === undefined ? undefined : toApiSchema(ctx, media.schema),
			examples: values.map((v) => ({
				label: v.label,
				lang,
				code: format(v.value, lang),
			})),
		};
	});
}

/** Path-level parameters apply unless the operation redefines the same name and location. */
function mergeParameters(doc: OpenAPIDocument, ...lists: unknown[]): Raw[] {
	const byKey = new Map<string, Raw>();
	for (const list of lists) {
		if (!Array.isArray(list)) continue;
		for (const item of list) {
			const param = deref(doc, item).schema;
			if (typeof param.name === "string")
				byKey.set(`${param.in}:${param.name}`, param);
		}
	}
	return [...byKey.values()];
}

function parameterExample(doc: OpenAPIDocument, param: Raw): unknown {
	if (param.example !== undefined) return param.example;
	if (isObject(param.examples)) {
		const first = Object.values(param.examples)[0];
		if (first !== undefined) return deref(doc, first).schema.value;
	}
	return declaredExample(deref(doc, param.schema).schema);
}

const formValue = (value: unknown) =>
	value === undefined
		? undefined
		: typeof value === "string"
			? value
			: JSON.stringify(value);

function toParameter(
	ctx: SchemaContext,
	param: Raw,
	location?: ApiParameter["in"],
): ApiParameter {
	return {
		name: String(param.name),
		in: (location ?? param.in) as ApiParameter["in"],
		required: param.required === true || param.in === "path",
		deprecated: param.deprecated === true,
		description: markdown(param.description),
		schema: toApiSchema(ctx, param.schema),
		example: formValue(parameterExample(ctx.doc, param)),
	};
}

function security(
	doc: OpenAPIDocument,
	requirements: unknown,
): ApiSecurity[][] {
	if (!Array.isArray(requirements)) return [];
	const schemes = doc.components?.securitySchemes ?? {};
	return requirements
		.filter(isObject)
		.map((requirement) =>
			Object.entries(requirement).flatMap(([name, scopes]) => {
				const scheme = deref(doc, schemes[name]).schema;
				if (typeof scheme.type !== "string") return [];
				return [
					{
						name,
						type: scheme.type as ApiSecurity["type"],
						scheme:
							typeof scheme.scheme === "string" ? scheme.scheme : undefined,
						bearerFormat:
							typeof scheme.bearerFormat === "string"
								? scheme.bearerFormat
								: undefined,
						in: scheme.in as ApiSecurity["in"],
						paramName:
							typeof scheme.name === "string" ? scheme.name : undefined,
						scopes: Array.isArray(scopes) ? scopes.map(String) : [],
						description: markdown(scheme.description),
					},
				];
			}),
		)
		.filter((alternative) => alternative.length > 0);
}

const statusOrder = (status: string) =>
	status === "default"
		? 1000
		: Number.parseInt(status.replace(/X/gi, "0"), 10) || 999;

function responses(ctx: SchemaContext, raw: unknown): ApiResponse[] {
	if (!isObject(raw)) return [];
	return Object.entries(raw)
		.map(([status, value]) => {
			const response = deref(ctx.doc, value).schema;
			const headers = isObject(response.headers)
				? Object.entries(response.headers).map(([name, header]) =>
						toParameter(
							ctx,
							{ ...deref(ctx.doc, header).schema, name },
							"header",
						),
					)
				: [];
			return {
				status,
				description: markdown(response.description),
				headers,
				contents: contents(ctx, response.content, "response"),
			};
		})
		.sort((a, b) => statusOrder(a.status) - statusOrder(b.status));
}

function sampleRequest(
	ctx: SchemaContext,
	method: ApiMethod,
	path: string,
	server: ApiServer | undefined,
	params: Raw[],
	body: ApiOperation["requestBody"],
	rawBody: Raw,
): SampleRequest {
	const filled = path.replace(/\{([^}]+)\}/g, (match, name: string) => {
		const param = params.find((p) => p.in === "path" && p.name === name);
		const value = param ? parameterExample(ctx.doc, param) : undefined;
		return value === undefined ? match : encodeURIComponent(String(value));
	});
	const pick = (location: string) =>
		params.flatMap((p) => {
			if (p.in !== location) return [];
			const example = parameterExample(ctx.doc, p);
			if (p.required !== true && example === undefined) return [];
			const value = example ?? sampleValue(ctx.doc, p.schema, "request");
			return [
				{
					name: String(p.name),
					value: typeof value === "string" ? value : JSON.stringify(value),
				},
			];
		});
	const first = body?.contents[0];
	const media =
		first && isObject(rawBody.content)
			? (rawBody.content as Raw)[first.mediaType]
			: undefined;
	const bodyValue = isObject(media)
		? (media.example ??
			(isObject(media.examples)
				? deref(ctx.doc, Object.values(media.examples)[0]).schema.value
				: undefined) ??
			sampleValue(ctx.doc, media.schema, "request"))
		: undefined;
	return {
		method,
		url: `${(server?.url ?? "").replace(/\/$/, "")}${filled}`,
		query: pick("query"),
		headers: pick("header"),
		body: first ? { mediaType: first.mediaType, value: bodyValue } : undefined,
	};
}

async function highlightAll(
	document: ApiDocument,
	highlight: NonNullable<BuildOptions["highlight"]>,
) {
	const examples: ApiExample[] = [];
	for (const op of document.operations) {
		examples.push(...op.samples);
		for (const content of op.requestBody?.contents ?? [])
			examples.push(...content.examples);
		for (const response of op.responses)
			for (const content of response.contents)
				examples.push(...content.examples);
	}
	await Promise.all(
		examples.map(async (example) => {
			(example as { html?: string }).html = await highlight(
				example.code,
				example.lang,
			);
		}),
	);
}

/** Resolves an OpenAPI 3.1 document (see `parseSpec`) into the render-ready model. */
export async function buildApiDocument(
	doc: OpenAPIDocument,
	options: BuildOptions = {},
): Promise<ApiDocument> {
	const ctx: SchemaContext = { doc, markdown };
	const rootServers = servers(doc.servers);
	const tags = new Map<string, ApiTag>();
	const addTag = (name: string, description?: unknown) => {
		if (!tags.has(name))
			tags.set(name, {
				name,
				slug: slugify(name),
				description: markdown(description),
			});
	};
	for (const tag of doc.tags ?? []) addTag(tag.name, tag.description);

	const operations: ApiOperation[] = [];
	const slugs = new Set<string>();
	for (const [path, rawItem] of Object.entries(doc.paths ?? {})) {
		const item = deref(doc, rawItem).schema;
		for (const lower of HTTP_METHODS) {
			const op = item[lower];
			if (!isObject(op)) continue;
			const method = lower.toUpperCase() as ApiMethod;
			const operationId =
				typeof op.operationId === "string" ? op.operationId : undefined;
			let slug = slugify(operationId ?? `${lower} ${path}`);
			for (let n = 2; slugs.has(slug); n++)
				slug = `${slugify(operationId ?? `${lower} ${path}`)}-${n}`;
			slugs.add(slug);

			const opTags = Array.isArray(op.tags) ? op.tags.map(String) : [];
			for (const tag of opTags) addTag(tag);
			const opServers = Array.isArray(op.servers)
				? servers(op.servers as OpenAPIServer[])
				: Array.isArray(item.servers)
					? servers(item.servers as OpenAPIServer[])
					: rootServers;
			const params = mergeParameters(doc, item.parameters, op.parameters);
			const rawBody = deref(doc, op.requestBody).schema;
			const requestBody = isObject(rawBody.content)
				? {
						required: rawBody.required === true,
						description: markdown(rawBody.description),
						contents: contents(ctx, rawBody.content, "request"),
					}
				: undefined;
			const auth = security(doc, op.security ?? doc.security);
			const request = withAuth(
				sampleRequest(
					ctx,
					method,
					path,
					opServers[0],
					params,
					requestBody,
					rawBody,
				),
				auth[0],
			);
			operations.push({
				slug,
				operationId,
				method,
				path,
				summary:
					typeof op.summary === "string" && op.summary
						? op.summary
						: `${method} ${path}`,
				description: markdown(op.description),
				deprecated: op.deprecated === true,
				tags: opTags,
				servers: opServers,
				security: auth,
				parameters: params.map((p) => toParameter(ctx, p)),
				requestBody,
				responses: responses(ctx, op.responses),
				samples: codeSamples(request, options.samples ?? DEFAULT_SAMPLES),
			});
		}
	}

	const document: ApiDocument = {
		title: doc.info?.title ?? "API",
		version: doc.info?.version,
		description: markdown(doc.info?.description),
		servers: rootServers,
		tags: [...tags.values()],
		operations,
	};
	if (options.highlight) await highlightAll(document, options.highlight);
	return document;
}
