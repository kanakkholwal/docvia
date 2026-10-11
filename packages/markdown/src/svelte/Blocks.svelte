<script lang="ts">
	import type { Block } from "@docvia/markdown";
	import Blocks from "./Blocks.svelte";
	import type { SvelteRenderOptions } from "./context";
	import Inlines from "./Inlines.svelte";

	let { nodes, options, tight = false }: { nodes: Block[]; options: SvelteRenderOptions; tight?: boolean } = $props();
</script>

{#each nodes as b, i (i)}
	{#if b.type === "paragraph"}
		{#if tight}<Inlines nodes={b.children} {options} />{:else}<p><Inlines nodes={b.children} {options} /></p>{/if}
	{:else if b.type === "heading"}
		<svelte:element this={`h${b.depth}`} id={b.id}><Inlines nodes={b.children} {options} /></svelte:element>
	{:else if b.type === "thematicBreak"}
		<hr />
	{:else if b.type === "blockquote"}
		<blockquote><Blocks nodes={b.children} {options} /></blockquote>
	{:else if b.type === "code"}
		<pre data-lang={b.lang || undefined} data-meta={b.meta || undefined}><code class={b.lang ? `language-${b.lang}` : undefined}>{b.value}</code></pre>
	{:else if b.type === "html"}
		{#if options.html}{@html b.value}{:else}<p>{b.value}</p>{/if}
	{:else if b.type === "list"}
		<svelte:element this={b.ordered ? "ol" : "ul"} start={b.ordered && b.start !== 1 ? b.start : undefined}>
			{#each b.children as item, j (j)}
				<li>
					{#if item.checked !== null}<input type="checkbox" disabled checked={item.checked} /> {/if}
					<Blocks nodes={item.children} {options} tight={b.tight} />
				</li>
			{/each}
		</svelte:element>
	{:else if b.type === "table"}
		<table>
			<thead><tr>{#each b.head as cell, j (j)}<th align={b.align[j] ?? undefined}><Inlines nodes={cell} {options} /></th>{/each}</tr></thead>
			{#if b.rows.length}
				<tbody>
					{#each b.rows as row, r (r)}<tr>{#each row as cell, j (j)}<td align={b.align[j] ?? undefined}><Inlines nodes={cell} {options} /></td>{/each}</tr>{/each}
				</tbody>
			{/if}
		</table>
	{:else if b.type === "directive"}
		{@const Custom = options.directiveComponents?.[b.name]}
		{#if Custom}
			<Custom name={b.name} attributes={b.attributes} inline={false}>
				<Blocks nodes={b.children} {options} />
			</Custom>
		{:else}
			<div data-directive={b.name} {...b.attributes}><Blocks nodes={b.children} {options} /></div>
		{/if}
	{/if}
{/each}
