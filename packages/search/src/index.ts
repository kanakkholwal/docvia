import type {
	HeadingMeta,
	IRDocument,
	IRNode,
	SearchDocument,
} from "@docvia/ir";
import type { RenderOutput } from "@docvia/renderer-core";
import {
	create,
	insertMultiple,
	load,
	type Orama,
	search as oramaSearch,
	removeMultiple,
	save,
} from "@orama/orama";

// Text Extraction (lazy, not stored in IR)

export function extractTextFromIR(children: readonly IRNode[]): string {
	const parts: string[] = [];
	function walk(nodes: readonly IRNode[]) {
		for (const node of nodes) {
			// biome-ignore lint/complexity/useLiteralKeys: not indexed
			if (node.type === "text") parts.push(node.props["value"] as string);
			// biome-ignore lint/complexity/useLiteralKeys: not indexed
			if (node.type === "code-block") parts.push(node.props["value"] as string);
			if (node.children.length) walk(node.children);
		}
	}
	walk(children);
	return parts.join(" ");
}

function extractPlainTextFromIR(node: IRNode): string {
	// biome-ignore lint/complexity/useLiteralKeys: not indexed
	if (node.type === "text") return node.props["value"] as string;
	return node.children.map(extractPlainTextFromIR).join("");
}

// Section-Level Extraction

export function extractSections(doc: IRDocument): SearchDocument[] {
	const sections: SearchDocument[] = [];
	let currentHeading: HeadingMeta | null = null;
	let currentParts: string[] = [];

	function flush() {
		if (currentParts.length > 0) {
			sections.push({
				slug: doc.slug,
				sectionId: currentHeading?.id ?? "_top",
				sectionTitle: currentHeading?.text ?? doc.frontmatter.title,
				content: currentParts.join(" "),
				depth: currentHeading?.depth ?? 0,
				pageTitle: doc.frontmatter.title,
			});
		}
		currentParts = [];
	}

	function walk(nodes: readonly IRNode[]) {
		for (const node of nodes) {
			if (node.type === "heading") {
				flush();
				currentHeading = {
					depth: node.props.depth as number,
					text: extractPlainTextFromIR(node),
					id: node.props.id as string,
				};
			}
			if (node.type === "text") currentParts.push(node.props.value as string);
			if (node.type === "code-block")
				currentParts.push(node.props.value as string);
			if (node.children.length) walk(node.children);
		}
	}

	walk(doc.children);
	flush();
	return sections;
}

// Search Index Builder

const searchSchema = {
	sectionTitle: "string" as const,
	pageTitle: "string" as const,
	content: "string" as const,
	slug: "string" as const,
	sectionId: "string" as const,
	depth: "number" as const,
};

export interface SearchIndexer {
	buildIndex(pages: readonly IRDocument[]): Promise<void>;
	updateIndex(
		changed: readonly IRDocument[],
		removed: readonly string[],
	): Promise<void>;
	exportIndex(): Promise<string>;
}

export async function createSearchIndexer(): Promise<SearchIndexer> {
	let db: Orama<typeof searchSchema> = await create({ schema: searchSchema });
	// Maps slug → inserted document IDs, enabling surgical removal on update
	const slugIds = new Map<string, string[]>();

	return {
		async buildIndex(pages) {
			db = await create({ schema: searchSchema });
			slugIds.clear();
			for (const page of pages) {
				const sections = extractSections(page);
				if (sections.length === 0) continue;
				const ids = await insertMultiple(db, sections);
				slugIds.set(page.slug, ids);
			}
		},

		async updateIndex(changed, removed) {
			// Remove stale sections for every affected slug
			const staleSlugs = [...changed.map((p) => p.slug), ...removed];
			const staleIds = staleSlugs.flatMap((slug) => slugIds.get(slug) ?? []);
			if (staleIds.length > 0) {
				await removeMultiple(db, staleIds);
				for (const slug of staleSlugs) slugIds.delete(slug);
			}

			// Re-insert updated pages
			for (const page of changed) {
				const sections = extractSections(page);
				if (sections.length === 0) continue;
				const ids = await insertMultiple(db, sections);
				slugIds.set(page.slug, ids);
			}
		},

		async exportIndex() {
			// `save()` returns Orama's plain serializable index data — the raw
			// `Orama` instance carries component *functions* that would not
			// survive `JSON.stringify`, so the index must be saved, not cloned.
			return JSON.stringify(save(db));
		},
	};
}

// Query Execution (shared by every search frontend)

export interface SearchResult {
	slug: string;
	sectionId: string;
	sectionTitle: string;
	pageTitle: string;
	/** Full section text — lets callers render a highlighted match snippet. */
	content: string;
	score: number;
}

async function runSearch(
	db: Orama<typeof searchSchema>,
	query: string,
	options?: { limit?: number },
): Promise<SearchResult[]> {
	const term = query.trim();
	if (!term) return [];

	const results = await oramaSearch(db, {
		term,
		limit: options?.limit ?? 10,
		// `threshold: 0` keeps only sections matching the *most* query tokens.
		// The Orama default (1) returns every section matching even a single
		// token, which floods multi-word searches with loosely-related noise.
		threshold: 0,
		boost: {
			sectionTitle: 3,
			pageTitle: 2,
			content: 1,
		},
	});

	return results.hits.map((hit) => ({
		slug: hit.document.slug as string,
		sectionId: hit.document.sectionId as string,
		sectionTitle: hit.document.sectionTitle as string,
		pageTitle: hit.document.pageTitle as string,
		content: hit.document.content as string,
		score: hit.score,
	}));
}

// Static client — rehydrate a pre-serialized index and search it in-browser.
// For fully static sites with no server; otherwise prefer the headless server
// search (`createFromSource` + `createSearchHandler`) below.

export async function createSearch(indexData: string) {
	// Rehydrate into a fresh Orama instance: `load()` restores the saved index
	// data onto a db that still has its component functions wired up. Parsing
	// the JSON straight into an `Orama` would yield a functionless object.
	const db: Orama<typeof searchSchema> = await create({ schema: searchSchema });
	load(db, JSON.parse(indexData));

	return {
		search: (query: string, options?: { limit?: number }) =>
			runSearch(db, query, options),
	};
}

// Headless server search (SSR / edge) — Fumadocs-style.
//
// Build an in-memory Orama index from the docvia source at server init and
// answer queries server-side. The index is derived from the already-bundled
// `virtual:docvia/source` content, so there is no filesystem access, no
// compiler, and no static index dump — it runs anywhere the SSR bundle runs,
// including Cloudflare Workers and other edge runtimes.

const HEADING_TAG = /^h([1-6])$/;

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, " ");
}

function nodeText(node: RenderOutput): string {
	const parts: string[] = [];
	const walk = (n: RenderOutput) => {
		if (n.kind === "text") parts.push(n.value);
		else if (n.kind === "html") parts.push(stripHtml(n.value));
		else if (n.kind === "element" || n.kind === "component")
			n.children?.forEach(walk);
		else if (n.kind === "fragment") n.children.forEach(walk);
	};
	walk(node);
	return parts.join("").replace(/\s+/g, " ").trim();
}

/**
 * Split a page's rendered `content` (a `RenderOutput` tree) into section-level
 * search documents — one per heading, plus a leading `_top` section. Runs at
 * request/init time on the server, so it needs neither the IR nor the compiler.
 */
export function extractSectionsFromContent(
	content: RenderOutput | readonly RenderOutput[] | undefined,
	page: { slug: string; pageTitle: string },
): SearchDocument[] {
	const sections: SearchDocument[] = [];
	let heading: { id: string; text: string; depth: number } | null = null;
	let parts: string[] = [];

	function flush() {
		const text = parts.join(" ").replace(/\s+/g, " ").trim();
		if (text) {
			sections.push({
				slug: page.slug,
				sectionId: heading?.id ?? "_top",
				sectionTitle: heading?.text || page.pageTitle,
				content: text,
				depth: heading?.depth ?? 0,
				pageTitle: page.pageTitle,
			});
		}
		parts = [];
	}

	function walk(node: RenderOutput) {
		if (node.kind === "element") {
			const match = HEADING_TAG.exec(node.tag);
			if (match) {
				// A heading closes the previous section and opens a new one; its
				// text becomes the section title, not body content. The anchor id
				// is carried as a prop by the renderer (`props.id`).
				flush();
				heading = {
					id: (node.props?.id as string | undefined) ?? node.id ?? "",
					text: nodeText(node),
					depth: Number(match[1]),
				};
				return;
			}
			node.children?.forEach(walk);
		} else if (node.kind === "text") {
			parts.push(node.value);
		} else if (node.kind === "html") {
			parts.push(stripHtml(node.value));
		} else if (node.kind === "component") {
			node.children?.forEach(walk);
		} else if (node.kind === "fragment") {
			node.children.forEach(walk);
		}
	}

	if (Array.isArray(content)) {
		for (const node of content) walk(node);
	} else if (content) {
		walk(content as RenderOutput);
	}
	flush();
	return sections;
}

/** Minimal structural view of a docvia collection — what indexing needs. */
interface IndexableCollection {
	getPages(): ReadonlyArray<{ slugs: string[] }>;
	getPage(
		slugs: string[],
	): Promise<{ data?: unknown; content?: unknown } | undefined>;
}
interface IndexableSource {
	collections: Record<string, IndexableCollection>;
}

export interface SearchServer {
	/** Run a query against the in-memory index. */
	search(query: string, options?: { limit?: number }): Promise<SearchResult[]>;
	/** Number of indexed sections. */
	readonly size: number;
}

/**
 * Build a {@link SearchServer} from a docvia source — a single collection (e.g.
 * `docs` from `virtual:docvia/source`) or a whole source (`{ collections }`).
 * Indexes every page's rendered content in memory. Call once per server
 * instance (cache the returned promise at module scope) and reuse it across
 * requests; pair it with {@link createSearchHandler} to expose a search route.
 */
export async function createFromSource(
	source: IndexableCollection | IndexableSource,
	options?: { defaultLimit?: number },
): Promise<SearchServer> {
	const collections =
		"collections" in source ? Object.values(source.collections) : [source];

	const db: Orama<typeof searchSchema> = await create({ schema: searchSchema });
	let size = 0;

	for (const collection of collections) {
		for (const { slugs } of collection.getPages()) {
			const page = await collection.getPage(slugs);
			if (!page) continue;
			const slug = slugs.join("/") || "index";
			const pageTitle =
				(page.data as { title?: string } | undefined)?.title ?? slug;
			const sections = extractSectionsFromContent(
				page.content as RenderOutput | undefined,
				{ slug, pageTitle },
			);
			if (sections.length > 0) {
				await insertMultiple(db, sections);
				size += sections.length;
			}
		}
	}

	return {
		get size() {
			return size;
		},
		search: (query, opts) =>
			runSearch(db, query, { limit: opts?.limit ?? options?.defaultLimit }),
	};
}

/**
 * Wrap a {@link SearchServer} as a framework-agnostic Web `Request` handler.
 * Reads the query from `?query=` (or `?q=`) and an optional `?limit=`, and
 * returns the results as JSON. Drop it into a SvelteKit `+server.ts`, a Next.js
 * route handler, a Hono route, or any Web-standard server — edge included.
 */
export function createSearchHandler(
	server: SearchServer,
): (request: Request) => Promise<Response> {
	return async (request) => {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("query") ?? searchParams.get("q") ?? "";
		const limitParam = Number(searchParams.get("limit"));
		const limit =
			Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;

		const results = await server.search(query, { limit });
		return new Response(JSON.stringify(results), {
			headers: { "content-type": "application/json" },
		});
	};
}

export interface FetchSearchClient {
	search(query: string, options?: { limit?: number }): Promise<SearchResult[]>;
}

/**
 * Client helper for headless mode: query a search endpoint backed by
 * {@link createSearchHandler}. Returns the same {@link SearchResult}[] as the
 * static client, so UIs are interchangeable. Debounce calls at the call site.
 */
export function createFetchClient(endpoint = "/api/search"): FetchSearchClient {
	return {
		async search(query, options) {
			const term = query.trim();
			if (!term) return [];
			const params = new URLSearchParams({ query: term });
			if (options?.limit) params.set("limit", String(options.limit));
			const res = await fetch(`${endpoint}?${params}`);
			if (!res.ok) return [];
			return (await res.json()) as SearchResult[];
		},
	};
}
