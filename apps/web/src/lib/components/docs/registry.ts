import type { ComponentRegistry } from "@docvia/core/render";
import ApiOperation from "#lib/components/openapi/api-operation.svelte";
import ApiOverview from "#lib/components/openapi/api-overview.svelte";
import MarkdownPlayground from "./markdown-playground.svelte";
import Mermaid from "./mermaid.svelte";

type Entry = NonNullable<ReturnType<ComponentRegistry["resolve"]>>;

const components: Record<string, Entry["component"]> = {
	// Emitted by @docvia/plugin-mermaid.
	Mermaid,
	// Rendered by the pages @docvia/plugin-openapi's openapiSource() generates.
	APIOperation: ApiOperation,
	APIOverview: ApiOverview,
	// `::markdown-playground` on the @docvia/markdown docs page.
	"markdown-playground": MarkdownPlayground,
};

/** Components the docs IR can reference by name. */
export const docsRegistry: ComponentRegistry = {
	resolve(name) {
		const component = components[name];
		return component ? { component } : null;
	},
};
