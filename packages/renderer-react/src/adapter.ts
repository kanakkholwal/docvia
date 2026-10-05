import type { RendererAdapter } from "@docvia/ir";
import {
	createModuleRenderer,
	type ModuleRendererOptions,
} from "@docvia/renderer-core";

/**
 * The React renderer, for `docvia.config`. Pages render with `<DocviaContent nodes={content}>`;
 * highlighting comes from a plugin such as `@docvia/plugin-shiki`.
 */
export function createReactRenderer(
	options: ModuleRendererOptions = {},
): RendererAdapter {
	return createModuleRenderer(
		{ name: "react", runtimePackage: "@docvia/renderer-react" },
		options,
	);
}
