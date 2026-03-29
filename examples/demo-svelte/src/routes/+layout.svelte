<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import Layout from "$lib/components/Layout.svelte";
	import "../app.css";

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Dockit Documentation</title>
	<meta name="description" content="Modern documentation site powered by Dockit" />
</svelte:head>

<Layout nav={data.nav} {children} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
