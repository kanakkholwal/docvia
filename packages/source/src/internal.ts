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
	/**
	 * Getter for the eager module map (avoids top-level await in source.ts).
	 *
	 * The server/non-lazy emit returns the map *synchronously*; only the browser
	 * emit, which resolves a `() => import()` per page, returns a promise. Both
	 * are accepted, and the synchronous form is used synchronously — see
	 * {@link beginResolve}.
	 */
	getEagerModules: () =>
		| Promise<Record<string, ModuleExports> | null>
		| Record<string, ModuleExports>
		| null;
	sourceModuleUrl: string;
}): docviaCollection<TFrontmatter, TRouteKey> {
	const { baseUrl, routeKeys, getModule } = opts;

	// Lazily resolved eager modules (cached after first access)
	let _eagerModules: Record<string, ModuleExports> | null | undefined;
	let _eagerPending: Promise<Record<string, ModuleExports> | null> | null =
		null;
	let _warnedCold = false;

	function isThenable(
		v: unknown,
	): v is Promise<Record<string, ModuleExports> | null> {
		return typeof (v as { then?: unknown } | null)?.then === "function";
	}

	function adopt(
		mods: Record<string, ModuleExports> | null,
	): Record<string, ModuleExports> | null {
		_eagerModules = mods;
		// A tree built while the cache was cold used slug-derived titles and
		// Infinity ordering. It is memoized, so without this it would stay wrong
		// for the life of the process.
		_pageTree = null;
		return mods;
	}

	/**
	 * Resolve the eager module map, synchronously when the generator allows it.
	 *
	 * Returns the map if it is available now, or `undefined` if resolution is
	 * still in flight. Awaiting a synchronously-available value would defer a
	 * microtask and hand the first caller an empty page tree, which is exactly
	 * the bug this avoids: on the server the map is already in hand.
	 */
	function beginResolve(): Record<string, ModuleExports> | null | undefined {
		if (_eagerModules !== undefined) return _eagerModules;
		if (_eagerPending) return undefined;

		const v = opts.getEagerModules();
		if (!isThenable(v)) return adopt(v);

		_eagerPending = v.then(adopt);
		// A failed dynamic import must not surface as an unhandled rejection; the
		// cold-cache fallbacks below already degrade gracefully. Callers that need
		// to know go through `ready()`.
		_eagerPending.catch(() => {});
		return undefined;
	}

	/**
	 * Eager modules if they are available *now*, else null.
	 *
	 * A null return means the caller gets slug-derived fallbacks. That is only
	 * reachable on the browser emit, where the map genuinely cannot be produced
	 * synchronously — `await collection.ready()` first to avoid it.
	 */
	function eagerModulesSync(): Record<string, ModuleExports> | null {
		const mods = beginResolve();
		if (mods !== undefined) return mods;

		if (!_warnedCold) {
			_warnedCold = true;
			console.warn(
				`[docvia] Collection "${opts.name}" was read before its page metadata resolved, ` +
					"so titles, ordering and frontmatter fall back to slug-derived values. " +
					`Await \`${opts.name}.ready()\` first, or read the collection from a server-only module.`,
			);
		}
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
		async ready() {
			const mods = beginResolve();
			if (mods !== undefined) return;
			await _eagerPending;
		},

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
