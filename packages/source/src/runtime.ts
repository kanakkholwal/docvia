import type {
	HydrationManifest,
	RenderOutput,
	StructuredData,
} from "@docvia/renderer-core";

export type {
	ComponentRegistry,
	HydrationEntry,
	HydrationManifest,
	RenderOutput,
	StructuredData,
} from "@docvia/renderer-core";

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
		/** Links to another site (from `[Text](https://...)` in `meta.json`). */
		external?: boolean;
		$id?: string;
	}
	export interface Folder {
		type: "folder";
		name: string;
		children: Node[];
		index?: Item;
		defaultOpen?: boolean;
		/** A root folder starts its own sidebar (`"root": true` in `meta.json`). */
		root?: boolean;
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
	/** The render tree; pass it to the renderer's `<Renderer nodes>` component. */
	content: RenderOutput;
	manifest: HydrationManifest;
	/** h2-h6 outline for a table of contents. */
	headings: Array<{ depth: number; text: string; id: string }>;
	/** Search sections, extracted at compile time. */
	structuredData?: StructuredData;
}

export interface docviaCollection<
	TFrontmatter = unknown,
	_TRouteKey extends string = string,
> {
	/** Resolves immediately: page metadata is always available synchronously. */
	ready(): Promise<void>;

	/** One page, loading its compiled body on demand. */
	getPage(
		slugs: string[] | undefined,
	): Promise<docviaPage<TFrontmatter> | undefined>;

	/** Every page with its frontmatter, without loading any body. */
	getPages(): Array<{ slugs: string[]; url: string; data: TFrontmatter }>;

	/** Navigation tree built from page titles and `order`. */
	pageTree: PageTree.Root;

	/** Method form of `pageTree`. */
	getPageTree(): PageTree.Root;

	/** Params for static generation (`generateStaticParams`, prerender entries). */
	generateParams<TSlug extends string = "slug">(
		slug?: TSlug,
	): Record<TSlug, string[]>[];
}

export interface docviaSource {
	collections: Record<string, docviaCollection<unknown, string>>;
}
