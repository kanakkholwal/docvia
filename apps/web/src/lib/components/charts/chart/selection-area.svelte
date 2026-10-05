<svelte:options namespace="svg" />

<script lang="ts">
import { cn } from "#lib/cn.js";
import { usePlot } from "./context";
import { type ChartSelectionEdge, chartSelection } from "./variants";

let { edge = "dashed", class: className }: { edge?: ChartSelectionEdge; class?: string } =
	$props();

const plot = usePlot();
const styles = $derived(chartSelection({ edge }));
let last: [number, number] | null = null;
const shown = $derived.by(() => {
	if (plot.selectionX) last = plot.selectionX;
	return plot.selectionX ?? last;
});
</script>

<!-- The dragged or Shift+Arrow range; fades in and out over 150ms. -->
{#if shown}
	<g
		data-slot="chart-selection"
		class={cn(styles.root(), className)}
		style:opacity={plot.selectionX ? 1 : 0}
	>
		<rect class={styles.area()} x={shown[0]} width={shown[1] - shown[0]} height={plot.innerHeight} />
		<line class={styles.edge()} x1={shown[0]} x2={shown[0]} y2={plot.innerHeight} />
		<line class={styles.edge()} x1={shown[1]} x2={shown[1]} y2={plot.innerHeight} />
	</g>
{/if}
