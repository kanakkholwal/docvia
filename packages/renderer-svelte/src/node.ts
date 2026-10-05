import type { RendererAdapter } from "@docvia/ir";
import {
	createModuleRenderer,
	type ModuleRendererOptions,
} from "@docvia/renderer-core";

export type {
	ModuleRendererOptions as SvelteRendererOptions,
	RenderTransform,
} from "@docvia/renderer-core";

/**
 * The Svelte renderer, for `docvia.config`. Pages render with `<Renderer>` from
 * `@docvia/renderer-svelte`; highlighting comes from a plugin such as `@docvia/plugin-shiki`.
 */
export function createSvelteRenderer(
	options: ModuleRendererOptions = {},
): RendererAdapter {
	return createModuleRenderer(
		{
			name: "svelte",
			runtimePackage: "@docvia/renderer-svelte",
			// `{@html}` needs no wrapper, so whole runs of static blocks become one node.
			staticHtml: { mergeSiblings: true },
		},
		options,
	);
}
