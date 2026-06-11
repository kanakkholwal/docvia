// @docvia/ssr — request-time rendering for a non-framework Node server.
//
// Renders IR resolved through a `ContentProvider` (e.g. the Node-only
// `FsContentProvider` in `@docvia/ssr/node`, which wraps a live
// `CompileService`). Framework apps don't need this — they render the in-place
// `?docvia` modules directly through their renderer.

import type { PageMeta } from "@docvia/ir";
import {
	createDefaultRendererMap,
	renderDocument,
	type SyntaxHighlighter,
} from "@docvia/renderer-core";
import { LRUCache } from "./lru";
import type { SSROptions, SSRPage, SSRRenderer } from "./types";

export { LRUCache } from "./lru";
export type {
	ContentProvider,
	ContentSource,
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
	// Accept a ContentProvider, a live CompileService, or a plain function —
	// normalize to the `{ getDocument }` shape the renderer uses.
	const src = options.provider;
	const provider = typeof src === "function" ? { getDocument: src } : src;
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
