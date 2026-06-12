import type {
	docviaCollection,
	docviaPage,
	docviaSource,
	PageTree,
} from "./runtime";

/**
 * Frontmatter-derived metadata a compiled page module exposes. The known fields
 * the collection reads (`title`, `order`, `headings`) are typed; the index
 * signature keeps arbitrary frontmatter accessible without casts.
 */
export interface ModuleMeta {
	title?: string;
	order?: number;
	headings?: Array<{ depth: number; text: string; id: string }>;
	[key: string]: unknown;
}

export interface ModuleExports {
	meta: ModuleMeta;
	// biome-ignore lint/suspicious/noExplicitAny: content shape varies by renderer (RenderOutput[] for React/Svelte adapters) — intentionally polymorphic.
	content: any;
	manifest: unknown;
}

export function createCollection<
	TFrontmatter = unknown,
	TRouteKey extends string = string,
>(opts: {
	name: string;
	baseUrl: string;
	routeKeys: readonly TRouteKey[];
	getModule: (slug: string) => Promise<ModuleExports | undefined>;
	/** Lazy getter for server-side eager modules (avoids top-level await in source.ts). */
	getEagerModules: () => Promise<Record<string, ModuleExports> | null>;
	sourceModuleUrl: string;
}): docviaCollection<TFrontmatter, TRouteKey> {
	const { baseUrl, routeKeys, getModule } = opts;

	// Lazily resolved eager modules (cached after first access)
	let _eagerModules: Record<string, ModuleExports> | null | undefined;
	async function resolveEagerModules(): Promise<Record<
		string,
		ModuleExports
	> | null> {
		if (_eagerModules !== undefined) return _eagerModules;
		_eagerModules = await opts.getEagerModules();
		return _eagerModules;
	}

	// Sync access to eager modules (returns null if not yet resolved)
	function eagerModulesSync(): Record<string, ModuleExports> | null {
		if (_eagerModules !== undefined) return _eagerModules;
		// Kick off resolution in background
		resolveEagerModules();
		return null;
	}

	const routeSet = new Set<string>(routeKeys);

	// Lazy-built page tree (cached after first access)
	let _pageTree: PageTree.Root | null = null;

	// Lazy-built children map for tree construction
	let _childrenMap: Map<string | null, string[]> | null = null;

	function ensureChildrenMap(): Map<string | null, string[]> {
		if (_childrenMap) return _childrenMap;
		_childrenMap = new Map();

		for (const key of routeKeys) {
			const segments = key.split("/");
			const parentSlug =
				segments.length <= 1 ? null : segments.slice(0, -1).join("/");

			let children = _childrenMap.get(parentSlug);
			if (!children) {
				children = [];
				_childrenMap.set(parentSlug, children);
			}
			children.push(key);
		}

		return _childrenMap;
	}

	function toTitleCase(segment: string): string {
		return segment
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function getTitle(slug: string): string {
		const eager = eagerModulesSync();
		if (eager?.[slug]?.meta?.title) {
			return eager[slug].meta.title;
		}
		const segments = slug.split("/");
		const last = segments[segments.length - 1] ?? slug;
		return last === "index" ? "Home" : toTitleCase(last);
	}

	function getOrder(slug: string): number {
		return eagerModulesSync()?.[slug]?.meta?.order ?? Number.POSITIVE_INFINITY;
	}

	function buildUrl(slug: string): string {
		if (slug === "index") return baseUrl || "/";
		const path = baseUrl.endsWith("/")
			? `${baseUrl}${slug}`
			: `${baseUrl}/${slug}`;
		return path;
	}

	function buildTreeNodes(parentSlug: string | null): PageTree.Node[] {
		const cm = ensureChildrenMap();
		const directChildren = cm.get(parentSlug) ?? [];

		// Sort by order then slug
		const sorted = [...directChildren].sort((a, b) => {
			const oa = getOrder(a);
			const ob = getOrder(b);
			if (oa !== ob) return oa - ob;
			return a.localeCompare(b);
		});

		const nodes: PageTree.Node[] = [];
		const seenFolders = new Set<string>();

		for (const slug of sorted) {
			const segments = slug.split("/");
			const lastSegment = segments[segments.length - 1] ?? slug;

			// Check if this slug has children (making it a folder)
			const hasChildren = cm.has(slug);

			if (hasChildren) {
				if (seenFolders.has(slug)) continue;
				seenFolders.add(slug);

				const folderNode: PageTree.Folder = {
					type: "folder",
					name: getTitle(slug),
					children: buildTreeNodes(slug),
					$id: slug,
				};

				// If the slug itself is a page (e.g., "guide" maps to guide/index or guide itself),
				// use it as the folder index
				if (routeSet.has(slug)) {
					folderNode.index = {
						type: "page",
						name: getTitle(slug),
						url: buildUrl(slug),
						$id: slug,
					};
				}

				// Also check for an "index" child
				const indexSlug = `${slug}/index`;
				if (routeSet.has(indexSlug)) {
					folderNode.index = {
						type: "page",
						name: getTitle(indexSlug),
						url: buildUrl(indexSlug),
						$id: indexSlug,
					};
				}

				nodes.push(folderNode);
			} else if (lastSegment === "index" && parentSlug !== null) {
			} else {
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

	function buildPageTree(): PageTree.Root {
		return {
			name: opts.name,
			children: buildTreeNodes(null),
		};
	}

	return {
		async getPage(slugs) {
			const normalizedSlugs = slugs?.filter(Boolean) ?? [];
			const key = (normalizedSlugs.join("/") || "index") as TRouteKey;

			if (!routeSet.has(key)) return undefined;

			const mod = await getModule(key);
			if (!mod) return undefined;

			return {
				slugs: normalizedSlugs,
				url: buildUrl(key),
				data: mod.meta as TFrontmatter,
				content: mod.content,
				manifest: mod.manifest,
				headings: mod.meta?.headings,
			} as docviaPage<TFrontmatter>;
		},

		getPages() {
			return routeKeys.map((slug) => {
				const slugs = slug === "index" ? [] : slug.split("/");
				const eager = eagerModulesSync();
				const data = (eager?.[slug]?.meta ?? {}) as TFrontmatter;
				return { slugs, url: buildUrl(slug), data };
			});
		},

		get pageTree() {
			if (!_pageTree) {
				_pageTree = buildPageTree();
			}
			return _pageTree;
		},

		getPageTree() {
			return this.pageTree;
		},

		generateParams(slug: string = "slug"): Array<Record<string, string[]>> {
			return routeKeys.map((key) => {
				const slugs = key === "index" ? [] : key.split("/");
				return { [slug]: slugs };
			});
		},
	};
}

export function createSource<
	TCollections extends Record<string, docviaCollection<unknown, string>>,
>(collections: TCollections): docviaSource & { collections: TCollections } {
	return { collections };
}
