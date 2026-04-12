import type {
	IRDocument,
	PageMeta,
	RenderedPage,
	RendererAdapter,
} from "@docvia/ir";

import {
	type ComponentRegistry,
	type RenderContext,
	type SyntaxHighlighter,
	createDefaultRendererMap,
	renderDocument,
} from "@docvia/renderer-core";

// Browser-safe highlighter creator that only loads shiki on demand (server-side)
export function createShikiHighlighter(opts?: {
	theme?: string;
	langs?: string[];
}): SyntaxHighlighter {
	const theme = opts?.theme ?? "github-dark";
	const langs = opts?.langs ?? [
		"javascript",
		"typescript",
		"bash",
		"json",
		"css",
		"html",
		"svelte",
	];

	return {
		async highlight(code: string, lang: string) {
			const g = globalThis as any;

			if (!g.__docvia_shiki__ && !g.__docvia_shiki_pending__) {
				g.__docvia_shiki_pending__ = (async () => {
					const { createHighlighter } = await import("shiki");
					const h = await createHighlighter({ themes: [theme], langs });
					g.__docvia_shiki__ = h;
					delete g.__docvia_shiki_pending__;
					return h;
				})();
			}

			const h = g.__docvia_shiki__ ?? (await g.__docvia_shiki_pending__);
			try {
				return { html: h.codeToHtml(code, { lang, theme }) };
			} catch {
				return { html: `<pre><code>${escapeHtml(code)}</code></pre>` };
			}
		},
	};
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Svelte Renderer Adapter

export function createSvelteRenderer(
	options: {
		highlighter?: SyntaxHighlighter;
		registry?: ComponentRegistry;
	} = {},
): RendererAdapter {
	const hl = options.highlighter ?? createShikiHighlighter();
	const registry = options.registry ?? {
		resolve: () => null,
	};

	return {
		name: "svelte",

		async renderPage(doc: IRDocument): Promise<RenderedPage> {
			const ctx: Omit<RenderContext, "manifest"> = {
				slug: doc.slug,
				meta: {
					slug: doc.slug,
					title: doc.frontmatter.title,
					description: doc.frontmatter.description,
					headings: doc.headings,
					contentHash: doc.contentHash,
					lastModified: Date.now(),
					tags: doc.frontmatter.tags,
					order: doc.frontmatter.order,
				},
				registry,
				highlighter: hl,
			};

			const { output, manifest } = await renderDocument(
				doc,
				createDefaultRendererMap(),
				ctx,
			);

			const code = [
				`export const meta = ${JSON.stringify(ctx.meta, null, 2)};`,
				"",
				`export const content = ${JSON.stringify(output, null, 2)};`,
				"",
				`export const manifest = ${JSON.stringify(manifest, null, 2)};`,
				"",
			].join("\n");

			return {
				slug: doc.slug,
				code,
				contentHash: doc.contentHash,
			};
		},

		async renderManifest(pages: readonly PageMeta[]): Promise<string> {
			const manifest = {
				pages: pages.map((p) => ({
					slug: p.slug,
					title: p.title,
					description: p.description,
					headings: p.headings,
					contentHash: p.contentHash,
					tags: p.tags,
					order: p.order,
				})),
				generatedAt: new Date().toISOString(),
			};
			return JSON.stringify(manifest, null, 2);
		},
	};
}

// Vite Plugin

export interface InMemoryStore {
	get(slug: string): RenderedPage | undefined;
	set(slug: string, page: RenderedPage): void;
	entries(): IterableIterator<[string, RenderedPage]>;
}

export function createInMemoryStore(): InMemoryStore {
	const store = new Map<string, RenderedPage>();
	return {
		get: (slug) => store.get(slug),
		set: (slug, page) => store.set(slug, page),
		entries: () => store.entries(),
	};
}

const VIRTUAL_PREFIX = "virtual:docvia/";
const RESOLVED_PREFIX = "\0virtual:docvia/";

export function docviaVitePlugin(store: InMemoryStore) {
	return {
		name: "docvia",

		resolveId(id: string) {
			if (id.startsWith(VIRTUAL_PREFIX)) {
				return `\0${id}`;
			}
			return undefined;
		},

		load(id: string) {
			if (id.startsWith(RESOLVED_PREFIX)) {
				const slug = id.slice(RESOLVED_PREFIX.length);
				const page = store.get(slug);
				if (!page) return null;
				return { code: page.code, map: (page as any).map ?? null };
			}
			return undefined;
		},
	};
}

export function invalidateModules(
	slugs: string[],
	// biome-ignore lint/suspicious/noExplicitAny: Vite server type
	server: any,
) {
	for (const slug of slugs) {
		const moduleId = RESOLVED_PREFIX + slug;
		const mod = server.moduleGraph?.getModuleById(moduleId);
		if (mod) {
			server.moduleGraph.invalidateModule(mod);
		}
	}
	server.ws?.send({
		type: "update",
		updates: slugs.map((slug) => ({
			type: "js-update" as const,
			path: VIRTUAL_PREFIX + slug,
			acceptedPath: VIRTUAL_PREFIX + slug,
			timestamp: Date.now(),
		})),
	});
}
