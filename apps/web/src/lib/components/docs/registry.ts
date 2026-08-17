import type { ComponentRegistry } from "@docvia/renderer-core";
import Mermaid from "./mermaid.svelte";

/** Components the docs IR can reference by name. `Mermaid` is emitted by @docvia/plugin-mermaid. */
export const docsRegistry: ComponentRegistry = {
	resolve(name) {
		if (name === "Mermaid") return { component: Mermaid };
		return null;
	},
};
