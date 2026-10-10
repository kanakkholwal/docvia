<script lang="ts">
import { COPY_BUTTON_HTML, type RenderOutput } from "@docvia/core/render";
import type { Component } from "svelte";
import Nodes from "./Nodes.svelte";
import type { RendererProps } from "./types";

const { nodes, registry, components }: RendererProps = $props();

const list = $derived(Array.isArray(nodes) ? nodes : [nodes]);

type Element = Extract<RenderOutput, { kind: "element" }>;
const rawHtml = (node: Element) =>
	node.children?.length && node.children.every((c) => c.kind === "html")
		? node.children.map((c) => (c.kind === "html" ? c.value : "")).join("")
		: null;
const isCodeBlock = (node: Element) => node.props?.["data-docvia-code"] !== undefined;
const asComponent = (value: unknown) => value as Component<Record<string, unknown>>;
</script>

{#each list as node}
	{#if node.kind === "text"}
		{node.value}
	{:else if node.kind === "html"}
		{@html node.value}
	{:else if node.kind === "element"}
		{@const CodeBlock = components?.codeBlock}
		{@const Override = components?.[node.tag]}
		{@const raw = rawHtml(node)}
		{#if CodeBlock && raw !== null && isCodeBlock(node)}
			<CodeBlock html={raw.replace(COPY_BUTTON_HTML, "")} id={node.id} className="docvia-code-block" />
		{:else if Override}
			<Override {...node.props} data-hid={node.id}>
				{#if node.children}<Nodes nodes={node.children} {registry} {components} />{/if}
			</Override>
		{:else}
			<svelte:element this={node.tag} {...node.props} data-hid={node.id}>
				{#if node.children}<Nodes nodes={node.children} {registry} {components} />{/if}
			</svelte:element>
		{/if}
	{:else if node.kind === "component"}
		{@const resolved = registry?.resolve(node.name)}
		{#if resolved}
			{@const Custom = asComponent(resolved.component)}
			<div data-hid={node.id} class="docvia-component-wrapper">
				<Custom {...node.props}>
					{#if node.children}<Nodes nodes={node.children} {registry} {components} />{/if}
				</Custom>
			</div>
		{:else}
			<div class="docvia-render-error" data-missing-component={node.name}>Unknown component: {node.name}</div>
		{/if}
	{:else if node.kind === "fragment"}
		<Nodes nodes={node.children} {registry} {components} />
	{/if}
{/each}
