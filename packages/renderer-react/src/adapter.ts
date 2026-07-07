// biome-ignore-all lint/suspicious/noExplicitAny: React component bridge types are intentionally erased to keep the adapter loose.
import type {
	IRDocument,
	PageMeta,
	RenderedPage,
	RendererAdapter,
} from "@docvia/ir";
import { toPageMeta } from "@docvia/ir";
import {
	type ComponentRegistry,
	createDefaultRendererMap,
	type RenderContext,
	renderDocument,
} from "@docvia/renderer-core";

// React renderer adapter

/**
 * Creates a docvia RendererAdapter for React.
 *
 * The adapter runs at build time (or server-side in dev mode). It walks the
 * IR document through the default renderer pipeline and serialises the result
 * as a JS module exporting `meta`, `content`, and `manifest`.
 *
 * The exported `content` is consumed at runtime by `<DocviaContent nodes={content}>`.
 * This keeps the adapter output framework-agnostic — it is pure JSON that any
 * React environment (Next.js App Router, Pages Router, Vite SPA) can consume.
 *
 * Syntax highlighting is a build-time plugin (e.g. `@docvia/plugin-shiki`), not
 * a renderer concern — add it to `plugins` in your docvia config.
 */
export function createReactRenderer(
	options: { registry?: ComponentRegistry } = {},
): RendererAdapter {
	const registry = options.registry ?? { resolve: () => null };

	return {
		name: "react",

		async renderPage(doc: IRDocument): Promise<RenderedPage> {
			const ctx: Omit<RenderContext, "manifest"> = {
				slug: doc.slug,
				meta: toPageMeta(doc),
				registry,
			};

			const { output, manifest } = await renderDocument(
				doc,
				createDefaultRendererMap(),
				ctx,
			);

			// Emit a plain JS module. The consumer imports `content` and passes
			// it to <DocviaContent nodes={content} />.
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

// Vite virtual-module plugin

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

/**
 * Vite plugin that resolves `virtual:docvia/<slug>` to the in-memory compiled
 * page module. Framework-agnostic — same as the Svelte adapter.
 */
export function docviaVitePlugin(store: InMemoryStore) {
	return {
		name: "docvia-react",

		resolveId(id: string) {
			if (id.startsWith(VIRTUAL_PREFIX)) return `\0${id}`;
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

/**
 * Signals Vite's dev server to invalidate and push HMR updates for the given
 * page slugs. Call this after re-compiling changed documents.
 */
export function invalidateModules(slugs: string[], server: any): void {
	for (const slug of slugs) {
		const moduleId = RESOLVED_PREFIX + slug;
		const mod = server.moduleGraph?.getModuleById(moduleId);
		if (mod) server.moduleGraph.invalidateModule(mod);
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
