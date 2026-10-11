import type {
	ApiDocument,
	ApiIndex,
	ApiMethod,
	ApiOperation,
	ApiOperationSummary,
	ApiSource,
} from "./model";

export type * from "./model";
export * from "./request";

export interface OpenAPISourceOptions {
	/** Folder the pages live under, relative to the docs collection. Default `"api"`. */
	readonly dir?: string;
	/** The docs `loader()` base URL, for the overview's links. Default `"/docs"`. */
	readonly baseUrl?: string;
	/** Registry names the pages render through. */
	readonly components?: {
		readonly operation?: string;
		readonly overview?: string;
	};
	/** Title of the overview page and the sidebar folder. Defaults to the spec title. */
	readonly title?: string;
}

/** Page frontmatter for generated pages; `openapi` tells them apart from Markdown pages. */
export interface OpenAPIPageData {
	readonly title: string;
	readonly description?: string;
	readonly eyebrow?: string;
	readonly openapi: {
		readonly method?: ApiMethod;
		readonly path?: string;
		readonly deprecated?: boolean;
	};
	load(): Promise<OpenAPILoadedPage>;
}

export interface OpenAPILoadedPage {
	content: {
		kind: "component";
		name: string;
		id: string;
		props: Record<string, unknown>;
	};
	headings: Array<{ depth: number; text: string; id: string }>;
	toc: Array<{ title: string; url: string; depth: number }>;
	manifest: [];
	structuredData: {
		headings: Array<{ id: string; content: string }>;
		contents: Array<{ heading: string | undefined; content: string }>;
	};
}

/** Summary of one operation, for the overview and its links. */
export interface ApiOperationLink {
	readonly method: ApiMethod;
	readonly path: string;
	readonly summary: string;
	readonly deprecated: boolean;
	readonly url: string;
}

export interface ApiOverview {
	readonly title: string;
	readonly version?: string;
	readonly description?: string;
	readonly servers: ApiDocument["servers"];
	readonly groups: ReadonlyArray<{
		readonly name: string;
		readonly description?: string;
		readonly operations: readonly ApiOperationLink[];
	}>;
}

/** Heading ids an operation page renders, in order; the UI and the TOC share them. */
export function operationSections(
	op: ApiOperation,
): Array<{ id: string; text: string }> {
	const out: Array<{ id: string; text: string }> = [];
	if (op.security.length > 0)
		out.push({ id: "authorization", text: "Authorization" });
	for (const [location, text] of [
		["path", "Path parameters"],
		["query", "Query parameters"],
		["header", "Header parameters"],
		["cookie", "Cookie parameters"],
	] as const) {
		if (op.parameters.some((p) => p.in === location))
			out.push({ id: `${location}-parameters`, text });
	}
	if (op.requestBody) out.push({ id: "request-body", text: "Request body" });
	if (op.responses.length > 0) out.push({ id: "responses", text: "Responses" });
	return out;
}

export const plainText = (html: string | undefined) =>
	html
		?.replace(/<[^>]+>/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();

function loaded(
	name: string,
	id: string,
	props: Record<string, unknown>,
	sections: Array<{ id: string; text: string }>,
	text: string | undefined,
): OpenAPILoadedPage {
	return {
		content: { kind: "component", name, id, props },
		headings: sections.map((s) => ({ depth: 2, text: s.text, id: s.id })),
		toc: sections.map((s) => ({ title: s.text, url: `#${s.id}`, depth: 2 })),
		manifest: [],
		structuredData: {
			headings: sections.map((s) => ({ id: s.id, content: s.text })),
			contents: text ? [{ heading: undefined, content: text }] : [],
		},
	};
}

/** The index of a document. */
export function apiIndex(api: ApiDocument): ApiIndex {
	const { operations, ...rest } = api;
	return {
		...rest,
		operations: operations.map((op) => ({
			slug: op.slug,
			method: op.method,
			path: op.path,
			summary: op.summary,
			deprecated: op.deprecated,
			tags: op.tags,
			text: plainText(op.description),
		})),
	};
}

/** Wraps a fully built document, for when it is small or already in memory. */
export function apiSource(api: ApiDocument): ApiSource {
	const bySlug = new Map(api.operations.map((op) => [op.slug, op]));
	return {
		index: apiIndex(api),
		async operation(slug) {
			const op = bySlug.get(slug);
			if (!op) throw new Error(`[docvia] No OpenAPI operation "${slug}"`);
			return op;
		},
	};
}

/**
 * Pages for a `loader()` source: an overview, then one page per operation in a folder per tag.
 * Concatenate `files` with your Markdown collection's files.
 */
export function openapiSource(
	source: ApiSource,
	options: OpenAPISourceOptions = {},
) {
	const api = source.index;
	const dir = (options.dir ?? "api").replace(/^\/|\/$/g, "");
	const base = (options.baseUrl ?? "/docs").replace(/\/$/, "");
	const operationComponent = options.components?.operation ?? "APIOperation";
	const overviewComponent = options.components?.overview ?? "APIOverview";
	const title = options.title ?? api.title;
	const tagOf = (op: ApiOperationSummary) =>
		api.tags.find((t) => t.name === op.tags[0]);
	const pathOf = (op: ApiOperationSummary) => {
		const tag = tagOf(op);
		return tag ? `${dir}/${tag.slug}/${op.slug}.md` : `${dir}/${op.slug}.md`;
	};
	const urlOf = (op: ApiOperationSummary) =>
		`${base}/${pathOf(op).replace(/\.md$/, "")}`;
	const link = (op: ApiOperationSummary): ApiOperationLink => ({
		method: op.method,
		path: op.path,
		summary: op.summary,
		deprecated: op.deprecated,
		url: urlOf(op),
	});

	const groups = [
		...api.tags.map((tag) => ({
			name: tag.name,
			description: plainText(tag.description),
			operations: api.operations.filter((op) => tagOf(op) === tag).map(link),
		})),
		{
			name: "Other",
			operations: api.operations.filter((op) => !tagOf(op)).map(link),
		},
	].filter((group) => group.operations.length > 0);
	const overview: ApiOverview = {
		title: api.title,
		version: api.version,
		description: api.description,
		servers: api.servers,
		groups,
	};
	const sectionsOf = (list: typeof groups) =>
		list.map((g) => ({
			id: `group-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
			text: g.name,
		}));
	const usedTags = api.tags.filter((tag) =>
		api.operations.some((op) => tagOf(op) === tag),
	);
	// A page per tag folder, so the folder and any breadcrumb pointing at it resolve.
	const tagPages = usedTags.flatMap((tag) => {
		const group = {
			name: "Endpoints",
			operations: api.operations.filter((op) => tagOf(op) === tag).map(link),
		};
		const props: ApiOverview = {
			title: tag.name,
			description: tag.description,
			servers: [],
			groups: [group],
		};
		return [
			{
				type: "meta" as const,
				path: `${dir}/${tag.slug}/meta.json`,
				data: { title: tag.name },
			},
			{
				type: "page" as const,
				path: `${dir}/${tag.slug}/index.md`,
				data: {
					title: tag.name,
					eyebrow: title,
					openapi: {},
					load: async () =>
						loaded(
							overviewComponent,
							`openapi-${dir}-${tag.slug}`,
							{ api: props },
							sectionsOf([group]),
							plainText(tag.description),
						),
				} satisfies OpenAPIPageData,
			},
		];
	});

	const files = [
		{
			type: "page" as const,
			path: `${dir}/index.md`,
			data: {
				// The overview renders the description itself, links included.
				title,
				openapi: {},
				load: async () =>
					loaded(
						overviewComponent,
						`openapi-${dir}`,
						{ api: overview },
						sectionsOf(groups),
						plainText(api.description),
					),
			} satisfies OpenAPIPageData,
		},
		{
			type: "meta" as const,
			path: `${dir}/meta.json`,
			data: { title, pages: [...usedTags.map((t) => t.slug), "..."] },
		},
		...tagPages,
		...api.operations.map((op) => ({
			type: "page" as const,
			path: pathOf(op),
			data: {
				title: op.summary,
				eyebrow: tagOf(op)?.name ?? title,
				openapi: {
					method: op.method,
					path: op.path,
					deprecated: op.deprecated,
				},
				load: async () => {
					const operation = await source.operation(op.slug);
					const text = [op.summary, op.text].filter(Boolean).join(" ");
					return loaded(
						operationComponent,
						`openapi-${op.slug}`,
						{ operation },
						operationSections(operation),
						text,
					);
				},
			} satisfies OpenAPIPageData,
		})),
	];
	return { files };
}
