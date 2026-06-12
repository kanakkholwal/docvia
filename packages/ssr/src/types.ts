import type { FrontmatterData, HeadingMeta, IRDocument } from "@docvia/ir";
import type {
	ComponentRegistry,
	HydrationManifest,
	RenderOutput,
} from "@docvia/renderer-core";

/**
 * Resolves a document's IR by collection + slug. A live `CompileService`
 * already satisfies this shape (it has `getDocument`), so you can pass one
 * straight to `createDocviaSSR` — no wrapper needed.
 */
export interface ContentProvider {
	getDocument(
		collection: string,
		slug: string,
	): Promise<IRDocument | undefined> | IRDocument | undefined;
}

/**
 * Anything that resolves IR by collection + slug: a `ContentProvider`, a live
 * `CompileService` (structurally a provider), or a plain function.
 */
export type ContentSource =
	| ContentProvider
	| ((
			collection: string,
			slug: string,
	  ) => Promise<IRDocument | undefined> | IRDocument | undefined);

/** A rendered page ready to hand to a framework's SSR layer. */
export interface SSRPage {
	readonly slug: string;
	readonly slugs: readonly string[];
	readonly url: string;
	readonly data: FrontmatterData;
	readonly content: RenderOutput;
	readonly manifest: HydrationManifest;
	readonly headings: readonly HeadingMeta[];
	readonly contentHash: string;
}

export interface SSROptions {
	/** A `ContentProvider`, a live `CompileService`, or a `getDocument` function. */
	readonly provider: ContentSource;
	/** Prepended to slugs when building `SSRPage.url`. Default: "/". */
	readonly baseUrl?: string;
	/** Component registry for hydrated islands. Default: empty. */
	readonly registry?: ComponentRegistry;
	/** Max rendered pages held in the LRU cache. Default: 100. */
	readonly cacheMax?: number;
}

export interface SSRRenderer {
	render(collection: string, slug: string): Promise<SSRPage | undefined>;
	/** Drop all cached rendered pages. */
	clearCache(): void;
}
