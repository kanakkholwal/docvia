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
	/** Get a single page by slug segments. */
	getPage(
		slugs: string[] | undefined,
	): Promise<docviaPage<TFrontmatter> | undefined>;

	/** Get all pages (server-side: full metadata from eager imports). */
	getPages(): Array<{ slugs: string[]; url: string; data: TFrontmatter }>;

	/** Page tree for navigation (lazily built from route keys). */
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
