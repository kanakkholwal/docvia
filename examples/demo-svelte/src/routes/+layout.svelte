<script lang="ts">
import Layout from "$lib/components/Layout.svelte";
import "../app.css";

let { data, children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Docvia Documentation</title>
	<meta name="description" content="Modern documentation site powered by docvia" />
</svelte:head>

<Layout tree={data.tree} {children} />
