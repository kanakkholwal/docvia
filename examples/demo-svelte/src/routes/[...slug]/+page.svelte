<script lang="ts">
	import { Renderer } from "@docvia/renderer-svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<article class="article">
	<Renderer nodes={data.page.content}/>
</article>

<style>
	.article {
		width: 100%;
	}
</style>
