import type {
	HeadingMeta,
	IRDocument,
	IRNode,
	SearchDocument,
} from "@docvia/ir";
import {
	create,
	insertMultiple,
	type Orama,
	search as oramaSearch,
	removeMultiple,
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
			return JSON.stringify(db);
		},
	};
}

// Client-Side Search Helper

export interface SearchResult {
	slug: string;
	sectionId: string;
	sectionTitle: string;
	pageTitle: string;
	score: number;
}

export async function createSearch(indexData: string) {
	const db = JSON.parse(indexData) as Orama<typeof searchSchema>;

	return {
		async search(
			query: string,
			options?: { limit?: number },
		): Promise<SearchResult[]> {
			const results = await oramaSearch(db, {
				term: query,
				limit: options?.limit ?? 10,
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
				score: hit.score,
			}));
		},
	};
}
