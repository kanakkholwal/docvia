<script lang="ts">
	import type { Inline } from "@docvia/markdown";
	import { defaultUrlTransform } from "@docvia/markdown";
	import type { SvelteRenderOptions } from "./context";
	import Inlines from "./Inlines.svelte";

	let { nodes, options }: { nodes: Inline[]; options: SvelteRenderOptions } = $props();
	const url = $derived(options.urlTransform ?? defaultUrlTransform);
	const split = (text: string) => text.split(/(\s+)/);
</script>

{#each nodes as n, i (i)}
	{#if n.type === "text"}
		{#if options.animate}{#each split(n.value) as part, j (j)}{#if /^\s*$/.test(part)}{part}{:else}<span data-md-word>{part}</span>{/if}{/each}{:else}{n.value}{/if}
	{:else if n.type === "emphasis"}<em><Inlines nodes={n.children} {options} /></em>
	{:else if n.type === "strong"}<strong><Inlines nodes={n.children} {options} /></strong>
	{:else if n.type === "delete"}<del><Inlines nodes={n.children} {options} /></del>
	{:else if n.type === "code"}<code>{n.value}</code>
	{:else if n.type === "break"}<br />
	{:else if n.type === "html"}{#if options.html}{@html n.value}{:else}{n.value}{/if}
	{:else if n.type === "link"}<a href={url(n.href, "href")} title={n.title || undefined}><Inlines nodes={n.children} {options} /></a>
	{:else if n.type === "image"}<img src={url(n.src, "src")} alt={n.alt} title={n.title || undefined} />
	{:else if n.type === "directive"}
		{@const Custom = options.directiveComponents?.[n.name]}
		{#if Custom}
			<Custom name={n.name} attributes={n.attributes} inline={true}>
				<Inlines nodes={n.children} {options} />
			</Custom>
		{:else}
			<span data-directive={n.name} {...n.attributes}><Inlines nodes={n.children} {options} /></span>
		{/if}
	{/if}
{/each}
