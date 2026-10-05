import type {
	IRDocument,
	PageMeta,
	RenderedPage,
	RendererAdapter,
} from "@docvia/ir";
import { toPageMeta, toStructuredData } from "@docvia/ir";
import { createDefaultRendererMap } from "./default-renderers";
import { renderDocument } from "./render";
import { collapseStatic, type StaticHtmlOptions } from "./static-html";
import type { ComponentRegistry, RenderOutput } from "./types";

/** Post-process a page's render tree before it is serialized. */
export type RenderTransform = (
	output: RenderOutput,
	doc: IRDocument,
) => RenderOutput | Promise<RenderOutput>;

export interface ModuleRendererOptions {
	/** Build-time registry, for resolving `hydrate`/`defaultProps` per component. */
	readonly registry?: ComponentRegistry;
	/** Rewrite the render tree (group nodes, add attributes) instead of forking the renderer. */
	readonly transform?: RenderTransform;
	/** Pre-render static subtrees to HTML (default on). `false` keeps every node. */
	readonly staticHtml?: StaticHtmlOptions | false;
}

/**
 * Emits each page as a module exporting `meta`, `content` ({@link RenderOutput}),
 * `manifest` and search `structuredData`. Framework renderers differ only in name and runtime package.
 */
export function createModuleRenderer(
	identity: {
		readonly name: string;
		readonly runtimePackage: string;
		/** Renderer defaults for {@link collapseStatic}; user options override them. */
		readonly staticHtml?: StaticHtmlOptions;
	},
	options: ModuleRendererOptions = {},
): RendererAdapter {
	const registry = options.registry ?? { resolve: () => null };
	return {
		name: identity.name,
		runtimePackages: [identity.runtimePackage],

		async renderPage(doc: IRDocument): Promise<RenderedPage> {
			const meta = toPageMeta(doc);
			const { output, manifest } = await renderDocument(
				doc,
				createDefaultRendererMap(),
				{ slug: doc.slug, meta, registry },
			);
			const transformed = options.transform
				? await options.transform(output, doc)
				: output;
			const content =
				options.staticHtml === false
					? transformed
					: collapseStatic(transformed, {
							...identity.staticHtml,
							...options.staticHtml,
						});
			const code = [
				`export const meta = ${JSON.stringify(meta)};`,
				`export const content = ${JSON.stringify(content)};`,
				`export const manifest = ${JSON.stringify(manifest)};`,
				`export const structuredData = ${JSON.stringify(toStructuredData(doc))};`,
				"",
			].join("\n");
			return { slug: doc.slug, code, contentHash: doc.contentHash };
		},

		async renderManifest(pages: readonly PageMeta[]): Promise<string> {
			return JSON.stringify(
				{
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
				},
				null,
				2,
			);
		},
	};
}
