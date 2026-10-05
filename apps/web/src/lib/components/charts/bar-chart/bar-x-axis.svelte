<svelte:options namespace="svg" />

<script lang="ts">
import BarAxis from "./bar-axis.svelte";

let {
	tickCount = 5,
	tickFormatter,
	labelFormatter,
	maxLabels = 12,
	class: className,
}: {
	/** Tick-count hint for the value axis; d3 may return a nearby count. */
	tickCount?: number;
	tickFormatter?: (value: number) => string;
	labelFormatter?: (category: string) => string;
	/** Most category labels shown before every nth one is skipped. */
	maxLabels?: number;
	class?: string;
} = $props();
</script>

<BarAxis side="x" {tickCount} {tickFormatter} {labelFormatter} {maxLabels} class={className} />
