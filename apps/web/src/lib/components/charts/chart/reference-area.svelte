<svelte:options namespace="svg" />

<script lang="ts">
import { cn } from "#lib/cn.js";
import { useCartesian } from "./context";
import type { ChartPhase } from "./core";
import { type ChartReferenceTone, chartReferenceArea } from "./variants";

let {
	y1,
	y2,
	x1,
	x2,
	label,
	tone = "muted",
	edges = true,
	class: className,
}: {
	/** Value range in data units; either end defaults to the plot edge. */
	y1?: number;
	y2?: number;
	/** Category or date range on the x axis; either end defaults to the plot edge. */
	x1?: unknown;
	x2?: unknown;
	label?: string;
	tone?: ChartReferenceTone;
	/** Dashed rules on the band's value edges. */
	edges?: boolean;
	class?: string;
} = $props();

const plot = useCartesian();
const styles = $derived(chartReferenceArea({ tone }));
/** Bands show from the grid retween on, so they settle with the series. */
const bandVisible = (phase: ChartPhase) =>
	phase === "ready" || phase === "revealing" || phase === "gridTweenReady";
const toY = (v: number | undefined, edge: number) =>
	v === undefined || !plot.rowScale ? edge : plot.rowScale(v);
const toX = (v: unknown, edge: number) =>
	v === undefined || !plot.columnScale ? edge : plot.columnScale(v);
const top = $derived(Math.max(0, Math.min(toY(y1, 0), toY(y2, 0))));
const bottom = $derived(
	Math.min(
		plot.innerHeight,
		Math.max(toY(y1, plot.innerHeight), toY(y2, plot.innerHeight)),
	),
);
const left = $derived(Math.max(0, Math.min(toX(x1, 0), toX(x2, 0))));
const right = $derived(
	Math.min(plot.innerWidth, Math.max(toX(x1, plot.innerWidth), toX(x2, plot.innerWidth))),
);
</script>

{#if bottom > top && right > left}
	<g
		data-slot="chart-reference-area"
		class={cn(styles.area(), className)}
		style:opacity={bandVisible(plot.phase) ? 1 : 0}
	>
		<rect x={left} y={top} width={right - left} height={bottom - top} />
		{#if edges && y2 !== undefined}
			<line class={styles.edge()} x1={left} x2={right} y1={top} y2={top} />
		{/if}
		{#if edges && y1 !== undefined}
			<line class={styles.edge()} x1={left} x2={right} y1={bottom} y2={bottom} />
		{/if}
		{#if label}
			<text class={styles.label()} x={right - 6} y={top + 14} text-anchor="end">{label}</text>
		{/if}
	</g>
{/if}
