import type {
	IRDocument,
	PageMeta,
	RenderedPage,
	RendererAdapter,
} from "@docvia/ir";
import { toPageMeta } from "@docvia/ir";
import { createDefaultRendererMap } from "./default-renderers";
import { renderDocument } from "./render";
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
}

/**
 * Emits each page as a module exporting `meta`, `content` ({@link RenderOutput}) and
 * `manifest`. Framework renderers differ only in name and runtime package.
 */
export function createModuleRenderer(
	identity: { readonly name: string; readonly runtimePackage: string },
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
			const content = options.transform
				? await options.transform(output, doc)
				: output;
			const code = [
				`export const meta = ${JSON.stringify(meta)};`,
				`export const content = ${JSON.stringify(content)};`,
				`export const manifest = ${JSON.stringify(manifest)};`,
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
