<script lang="ts">
	import { Renderer } from '@docvia/renderer-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={data.description} />
</svelte:head>

<article class="docs-content">
	<h1>{data.title}</h1>
	{#if data.description}
		<p class="docs-description">{data.description}</p>
	{/if}
	<Renderer nodes={data.content} />
</article>

<aside class="docs-toc">
	<p>On this page</p>
	<ul>
		{#each data.toc as item (item.url)}
			<li style:padding-left="{(item.depth - 2) * 12}px"><a href={item.url}>{item.title}</a></li>
		{/each}
	</ul>
</aside>
