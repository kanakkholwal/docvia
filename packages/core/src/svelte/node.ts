import type { RendererAdapter } from "@docvia/core";
import {
	createModuleRenderer,
	type ModuleRendererOptions,
} from "@docvia/core/render";

export type {
	ModuleRendererOptions as SvelteRendererOptions,
	RenderTransform,
} from "@docvia/core/render";

/**
 * The Svelte renderer, for `docvia.config`. Pages render with `<Renderer>` from
 * `@docvia/core/svelte`; highlighting comes from a plugin such as `@docvia/plugin-shiki`.
 */
export function createSvelteRenderer(
	options: ModuleRendererOptions = {},
): RendererAdapter {
	return createModuleRenderer(
		{
			name: "svelte",
			runtimePackage: "@docvia/core/svelte",
			// `{@html}` needs no wrapper, so whole runs of static blocks become one node.
			staticHtml: { mergeSiblings: true, keepTags: ["a", "img"] },
		},
		options,
	);
}
