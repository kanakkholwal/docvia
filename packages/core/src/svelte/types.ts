import type { ComponentRegistry, RenderOutput } from "@docvia/core/render";
import type { Component } from "svelte";

/** Props for a `codeBlock` override; `html` is the highlighted `<pre>` without the copy button. */
export interface CodeBlockOverrideProps {
	html: string;
	id?: string;
	className: string;
}

/** Tag overrides (`{ a: Link }`) plus a `codeBlock` slot, same contract as the React renderer. */
export interface RendererComponents {
	codeBlock?: Component<CodeBlockOverrideProps>;
	// biome-ignore lint/suspicious/noExplicitAny: each override takes its own tag's props.
	[tag: string]: Component<any> | undefined;
}

export interface RendererProps {
	nodes: RenderOutput | RenderOutput[];
	registry?: ComponentRegistry;
	components?: RendererComponents;
}
