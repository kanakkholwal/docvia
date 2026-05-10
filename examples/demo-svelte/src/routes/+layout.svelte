<script lang="ts">
	import { page } from "$app/state";
	import Layout from "$lib/components/Layout.svelte";
	import "../app.css";

	let { data, children } = $props();

	// The home page renders standalone (no docs sidebar / TOC chrome).
	const isHome = $derived(page.url.pathname === "/");
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Docvia · SvelteKit demo</title>
	<meta
		name="description"
		content="A demo of docvia running inside SvelteKit with Svelte 5 and the createSvelteRenderer adapter."
	/>
</svelte:head>

{#if isHome}
	{@render children()}
{:else}
	<Layout tree={data.tree} {children} />
{/if}
