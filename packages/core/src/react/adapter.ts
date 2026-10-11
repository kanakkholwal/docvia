import type { RendererAdapter } from "../ir/index";
import {
	createModuleRenderer,
	type ModuleRendererOptions,
} from "../render/index";

/**
 * The React renderer, for `docvia.config`. Pages render with `<Renderer nodes={content}>`;
 * highlighting comes from a plugin such as `@docvia/plugin-shiki`.
 */
export function createReactRenderer(
	options: ModuleRendererOptions = {},
): RendererAdapter {
	return createModuleRenderer(
		{
			name: "react",
			runtimePackage: "@docvia/core/react",
			// `components` can override these (e.g. a router link), so they stay nodes.
			staticHtml: { keepTags: ["a", "img"] },
		},
		options,
	);
}
