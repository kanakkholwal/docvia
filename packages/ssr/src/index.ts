// @docvia/ssr — request-time rendering. Edge-safe entry point.
//
// No `node:fs`/`node:os` imports here, so this entry is safe to bundle for
// Cloudflare Workers and other edge runtimes. The Node-only `FsContentProvider`
// lives in `@docvia/ssr/node`.

import type { IRDocument, PageMeta } from "@docvia/ir";
import {
	createDefaultRendererMap,
	renderDocument,
	type SyntaxHighlighter,
} from "@docvia/renderer-core";
import { LRUCache } from "./lru";
import type {
	ContentProvider,
	SSROptions,
	SSRPage,
	SSRRenderer,
} from "./types";

export { LRUCache } from "./lru";
export type {
	ContentProvider,
	SSROptions,
	SSRPage,
	SSRRenderer,
} from "./types";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Fallback highlighter. With @docvia/plugin-shiki the IR is already highlighted
// (code-block nodes carry `props.html`), so the renderer never calls this — it
// only guards documents compiled without any highlighter plugin.
const fallbackHighlighter: SyntaxHighlighter = {
	highlight: async (code) => ({
		html: `<pre><code>${escapeHtml(code)}</code></pre>`,
	}),
};

function joinUrl(baseUrl: string, slug: string): string {
	const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	const rest = slug.startsWith("/") ? slug.slice(1) : slug;
	return rest ? `${base}/${rest}` : base || "/";
}

/**
 * Create a request-time SSR renderer. Resolves IR through the given
 * `ContentProvider`, renders it with the shared `@docvia/renderer-core`
 * pipeline (so output matches the build), and caches rendered pages in an LRU
 * keyed by `contentHash`.
 */
export function createDocviaSSR(options: SSROptions): SSRRenderer {
	const { provider } = options;
	const baseUrl = options.baseUrl ?? "/";
	const registry = options.registry ?? { resolve: () => null };
	const cache = new LRUCache<string, SSRPage>(options.cacheMax ?? 100);
	const rendererMap = createDefaultRendererMap();

	return {
		async render(collection, slug) {
			const ir = await provider.getDocument(collection, slug);
			if (!ir) return undefined;

			const cached = cache.get(ir.contentHash);
			if (cached) return cached;

			const meta: PageMeta = {
				slug: ir.slug,
				title: ir.frontmatter.title,
				description: ir.frontmatter.description,
				headings: ir.headings,
				contentHash: ir.contentHash,
				lastModified: Date.now(),
				tags: ir.frontmatter.tags,
				order: ir.frontmatter.order,
			};

			const { output, manifest } = await renderDocument(ir, rendererMap, {
				slug: ir.slug,
				meta,
				registry,
				highlighter: fallbackHighlighter,
			});

			const page: SSRPage = {
				slug: ir.slug,
				slugs: ir.slug.split("/").filter(Boolean),
				url: joinUrl(baseUrl, ir.slug),
				data: ir.frontmatter,
				content: output,
				manifest,
				headings: ir.headings,
				contentHash: ir.contentHash,
			};
			cache.set(ir.contentHash, page);
			return page;
		},

		clearCache() {
			cache.clear();
		},
	};
}

/** A loader that resolves a per-route IR chunk built into `.docvia/ir/`. */
export type ChunkLoader = (
	collection: string,
	slug: string,
) => Promise<IRDocument | undefined> | IRDocument | undefined;

/**
 * Edge-safe content provider. Serves pre-built IR chunks via a caller-supplied
 * loader (e.g. a dynamic `import()` of the JSON, or an `import.meta.glob` map).
 * No filesystem or markdown parsing at request time.
 */
export function BundledContentProvider(load: ChunkLoader): ContentProvider {
	return {
		async getDocument(collection, slug) {
			return (await load(collection, slug)) ?? undefined;
		},
	};
}

/**
 * A Vite `import.meta.glob` map of the build's per-route IR chunks — keys are
 * absolute module paths, values are lazy importers of the chunk JSON.
 */
export type ChunkGlob = Record<
	string,
	() => Promise<{ default: IRDocument } | IRDocument>
>;

/**
 * Turn a Vite `import.meta.glob("/.docvia/ir/`**`/*.json")` map into a
 * `ChunkLoader` for `BundledContentProvider`. The glob is statically analysable
 * by the bundler, so every IR chunk is code-split and shipped — no `node:fs`,
 * edge-safe.
 *
 * @example
 * const loader = createGlobChunkLoader(
 *   import.meta.glob("/.docvia/ir/**\/*.json"),
 * );
 * const ssr = createDocviaSSR({ provider: BundledContentProvider(loader) });
 */
export function createGlobChunkLoader(
	glob: ChunkGlob,
	irBasePath = "/.docvia/ir/",
): ChunkLoader {
	return async (collection, slug) => {
		const importer = glob[`${irBasePath}${collection}/${slug}.json`];
		if (!importer) return undefined;
		const mod = await importer();
		return (
			mod && typeof mod === "object" && "default" in mod ? mod.default : mod
		) as IRDocument;
	};
}
