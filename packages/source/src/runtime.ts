// biome-ignore lint/suspicious/noExplicitAny: HydrationManifest shape is renderer-specific (e.g. island map for React, props bag for Svelte) — intentionally polymorphic at this layer.
export type HydrationManifest = any;

// PageTree types (Fumadocs-compatible)

export namespace PageTree {
	export interface Root {
		name: string;
		children: Node[];
	}
	export interface Item {
		type: "page";
		name: string;
		url: string;
		$id?: string;
	}
	export interface Folder {
		type: "folder";
		name: string;
		children: Node[];
		index?: Item;
		defaultOpen?: boolean;
		$id?: string;
	}
	export interface Separator {
		type: "separator";
		name: string;
	}
	export type Node = Item | Folder | Separator;
}

export interface docviaPage<TFrontmatter = unknown> {
	slugs: string[];
	url: string;
	data: TFrontmatter;
	// biome-ignore lint/suspicious/noExplicitAny: content shape varies by renderer (RenderOutput[] for React/Svelte adapters; JSX/Snippet for direct mounts) — intentionally polymorphic.
	content: any;
	manifest: HydrationManifest;
	headings?: Array<{ depth: number; text: string; id: string }>;
}

export interface docviaCollection<
	TFrontmatter = unknown,
	_TRouteKey extends string = string,
> {
	/**
	 * Resolve page metadata, so the synchronous readers below return real data.
	 *
	 * Only needed on the browser build, where metadata is resolved through a
	 * dynamic import per page and cannot be produced synchronously. On the server
	 * the metadata is already in hand and this resolves immediately — awaiting it
	 * is harmless, so universal code can always await it.
	 */
	ready(): Promise<void>;

	/**
	 * Get a single page by slug segments. Always accurate — it awaits the page
	 * module regardless of build.
	 */
	getPage(
		slugs: string[] | undefined,
	): Promise<docviaPage<TFrontmatter> | undefined>;

	/**
	 * Get all pages with their frontmatter.
	 *
	 * Synchronous, so on the browser build it returns empty `data` (and logs a
	 * warning) until metadata resolves — `await ready()` first there.
	 */
	getPages(): Array<{ slugs: string[]; url: string; data: TFrontmatter }>;

	/**
	 * Page tree for navigation (lazily built from route keys).
	 *
	 * Same caveat as {@link getPages}: on the browser build, reading this before
	 * {@link ready} resolves yields slug-derived titles and alphabetical order.
	 */
	pageTree: PageTree.Root;

	/** Method form of pageTree (for future i18n). */
	getPageTree(): PageTree.Root;

	/** Generate params for Next.js generateStaticParams(). */
	generateParams<TSlug extends string = "slug">(
		slug?: TSlug,
	): Record<TSlug, string[]>[];
}

export interface docviaSource {
	collections: Record<string, docviaCollection<unknown, string>>;
}
