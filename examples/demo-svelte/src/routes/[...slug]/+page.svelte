<script lang="ts">
	import { Renderer } from "@dockit/renderer-svelte";
	import { registry } from "dockit:source/registry";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<article class="article">
	<Renderer nodes={data.page.content} {registry} />
</article>

<style>
	.article {
		width: 100%;
	}
</style>
