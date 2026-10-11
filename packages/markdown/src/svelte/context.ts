import type { Attributes } from "@docvia/markdown";
import type { Component, Snippet } from "svelte";

export interface SvelteRenderOptions {
	/** Components for docvia directives by name; they receive `attributes`, `inline` and `children`. */
	directiveComponents?: Record<
		string,
		Component<{
			name: string;
			attributes: Attributes;
			inline: boolean;
			children?: Snippet;
		}>
	>;
	urlTransform?: (url: string, kind: "href" | "src") => string;
	/** Wrap words in spans that fade in when they first appear. */
	animate?: boolean;
	html?: boolean;
}
