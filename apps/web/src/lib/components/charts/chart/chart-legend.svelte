<script lang="ts">
import type { Snippet } from "svelte";
import ChartLegendContent from "./chart-legend-content.svelte";

let {
	content,
	interactive = true,
}: {
	content?: Snippet;
	/** False renders a static key instead of series toggles. */
	interactive?: boolean;
} = $props();
</script>

{#if content}
	{@render content()}
{:else}
	<ChartLegendContent {interactive} />
{/if}
