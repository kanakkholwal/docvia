<svelte:options namespace="svg" />

<script lang="ts">
import { useChart, usePlot } from "./context";
import { fittedTicks, Y_TICK_GAP } from "./core";
import { CHART_DURATION, CHART_EASE_CSS } from "./motion";
import { chartAxis } from "./variants";

let {
	tickCount = 5,
	tickFormatter,
	orientation = "left",
	tickLine = false,
	class: className,
}: {
	/** Tick-count hint; d3 may return a nearby count. */
	tickCount?: number;
	tickFormatter?: (value: number) => string;
	orientation?: "left" | "right";
	tickLine?: boolean;
	class?: string;
} = $props();

const chart = useChart();
const plot = usePlot();
const slide = `transform ${CHART_DURATION.update}ms ${CHART_EASE_CSS}`;
const styles = $derived(chartAxis({ tickLine }));
const left = $derived(orientation === "left");
const ticks = $derived(fittedTicks(plot.yScale, tickCount, plot.innerHeight, Y_TICK_GAP));
</script>

<g data-slot="chart-y-axis" class={className}>
	{#each ticks as tick (tick)}
		<g
			style:transform="translate({left ? 0 : plot.innerWidth}px, {plot.yScale(tick)}px)"
			style:transition={slide}
		>
			<line class={styles.line()} x1={left ? -4 : 0} x2={left ? 0 : 4} />
			<text
				class={styles.tick()}
				x={left ? -8 : 8}
				dominant-baseline="middle"
				text-anchor={left ? "end" : "start"}
			>
				{tickFormatter ? tickFormatter(tick) : chart.format.compact(tick)}
			</text>
		</g>
	{/each}
</g>
