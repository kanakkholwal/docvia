import type {
	docviaCollection,
	docviaPage,
	docviaSource,
	PageTree,
	RenderOutput,
	StructuredData,
} from "./runtime";

/** A page's frontmatter as indexed up front; `slug` is always present. */
export interface ModuleMeta {
	slug: string;
	title?: string;
	order?: number;
	headings?: Array<{ depth: number; text: string; id: string }>;
	[key: string]: unknown;
}

export interface ModuleExports {
	meta: ModuleMeta;
	content: RenderOutput;
	manifest: unknown;
	structuredData?: StructuredData;
}

export interface CollectionOptions {
	name: string;
	baseUrl: string;
	/** Frontmatter per file, keyed by file path; available synchronously. */
	meta: Record<string, ModuleMeta>;
	/** Compiled body per file (same keys), loaded on first `getPage()`. */
	bodies: Record<string, () => Promise<ModuleExports>>;
}

export function createCollection<
	TFrontmatter = unknown,
	TRouteKey extends string = string,
>(opts: CollectionOptions): docviaCollection<TFrontmatter, TRouteKey> {
	const { baseUrl } = opts;
	const fileBySlug = new Map<string, string>();
	for (const [file, meta] of Object.entries(opts.meta)) {
		fileBySlug.set(meta.slug, file);
	}
	const routeKeys = [...fileBySlug.keys()].sort();
	const metaOf = (slug: string) => {
		const file = fileBySlug.get(slug);
		return file ? opts.meta[file] : undefined;
	};

	function toTitleCase(segment: string): string {
		return segment
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function getTitle(slug: string): string {
		const title = metaOf(slug)?.title;
		if (title) return title;
		const last = slug.split("/").at(-1) ?? slug;
		return last === "index" ? "Home" : toTitleCase(last);
	}

	const getOrder = (slug: string) =>
		metaOf(slug)?.order ?? Number.POSITIVE_INFINITY;

	function buildUrl(slug: string): string {
		if (slug === "index") return baseUrl || "/";
		return baseUrl.endsWith("/") ? `${baseUrl}${slug}` : `${baseUrl}/${slug}`;
	}

	let childrenMap: Map<string | null, string[]> | null = null;
	function children(): Map<string | null, string[]> {
		if (childrenMap) return childrenMap;
		childrenMap = new Map();
		for (const key of routeKeys) {
			const segments = key.split("/");
			const parent =
				segments.length <= 1 ? null : segments.slice(0, -1).join("/");
			const list = childrenMap.get(parent) ?? [];
			list.push(key);
			childrenMap.set(parent, list);
		}
		return childrenMap;
	}

	function buildTreeNodes(parentSlug: string | null): PageTree.Node[] {
		const cm = children();
		const sorted = [...(cm.get(parentSlug) ?? [])].sort((a, b) => {
			const oa = getOrder(a);
			const ob = getOrder(b);
			return oa !== ob ? oa - ob : a.localeCompare(b);
		});
		const nodes: PageTree.Node[] = [];
		for (const slug of sorted) {
			const last = slug.split("/").at(-1) ?? slug;
			if (cm.has(slug)) {
				const folder: PageTree.Folder = {
					type: "folder",
					name: getTitle(slug),
					children: buildTreeNodes(slug),
					$id: slug,
				};
				const indexSlug = fileBySlug.has(`${slug}/index`)
					? `${slug}/index`
					: slug;
				if (fileBySlug.has(indexSlug)) {
					folder.index = {
						type: "page",
						name: getTitle(indexSlug),
						url: buildUrl(indexSlug),
						$id: indexSlug,
					};
				}
				nodes.push(folder);
			} else if (!(last === "index" && parentSlug !== null)) {
				nodes.push({
					type: "page",
					name: getTitle(slug),
					url: buildUrl(slug),
					$id: slug,
				});
			}
		}
		return nodes;
	}

	let pageTree: PageTree.Root | null = null;
	// Index and glob keys can differ only in path case on case-insensitive file systems.
	let bodiesByLowerKey: Map<string, () => Promise<ModuleExports>> | undefined;
	const bodyFor = (file: string) => {
		const exact = opts.bodies[file];
		if (exact) return exact;
		bodiesByLowerKey ??= new Map(
			Object.entries(opts.bodies).map(([k, v]) => [k.toLowerCase(), v]),
		);
		return bodiesByLowerKey.get(file.toLowerCase());
	};

	return {
		async ready() {},

		async getPage(slugs) {
			const normalized = slugs?.filter(Boolean) ?? [];
			const key = normalized.join("/") || "index";
			const file = fileBySlug.get(key);
			const load = file ? bodyFor(file) : undefined;
			if (!load) return undefined;
			const mod = await load();
			return {
				slugs: normalized,
				url: buildUrl(key),
				data: { ...opts.meta[file as string], ...mod.meta } as TFrontmatter,
				content: mod.content,
				manifest: mod.manifest,
				headings: mod.meta?.headings ?? [],
				structuredData: mod.structuredData,
			} as docviaPage<TFrontmatter>;
		},

		getPages() {
			return routeKeys.map((slug) => ({
				slugs: slug === "index" ? [] : slug.split("/"),
				url: buildUrl(slug),
				data: metaOf(slug) as TFrontmatter,
			}));
		},

		get pageTree() {
			pageTree ??= { name: opts.name, children: buildTreeNodes(null) };
			return pageTree;
		},

		getPageTree() {
			return this.pageTree;
		},

		generateParams(slug: string = "slug"): Array<Record<string, string[]>> {
			return routeKeys.map((key) => ({
				[slug]: key === "index" ? [] : key.split("/"),
			}));
		},
	};
}

export function createSource<
	TCollections extends Record<string, docviaCollection<unknown, string>>,
>(collections: TCollections): docviaSource & { collections: TCollections } {
	return { collections };
}
