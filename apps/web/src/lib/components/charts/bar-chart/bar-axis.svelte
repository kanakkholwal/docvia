<svelte:options namespace="svg" />

<script lang="ts">
import { useChart } from "#lib/components/charts/chart/context.js";
import { fittedTicks, X_TICK_GAP, Y_TICK_GAP } from "#lib/components/charts/chart/core.js";
import { CHART_DURATION, CHART_EASE_CSS } from "#lib/components/charts/chart/motion.js";
import { cn } from "#lib/cn.js";
import { useBarChart } from "./context";
import { barChart } from "./variants";

let {
	side,
	tickCount,
	tickFormatter,
	labelFormatter,
	maxLabels,
	class: className,
}: {
	side: "x" | "y";
	tickCount: number;
	tickFormatter?: (value: number) => string;
	labelFormatter?: (category: string) => string;
	maxLabels: number;
	class?: string;
} = $props();

const chart = useBarChart();
const root = useChart();
const slide = `transform ${CHART_DURATION.update}ms ${CHART_EASE_CSS}`;
const styles = $derived(barChart({ orientation: chart.orientation }));
/** Category labels run along the category axis; value ticks along the other. */
const categoryAxis = $derived((chart.orientation === "vertical") === (side === "x"));
const half = $derived(chart.band.bandwidth() / 2);
const step = $derived(Math.ceil(chart.categories.length / maxLabels));
const ticks = $derived.by(() => {
	const [r0 = 0, r1 = 0] = chart.value.range();
	const gap = side === "y" ? Y_TICK_GAP : X_TICK_GAP;
	return fittedTicks(chart.value, tickCount, Math.abs(r1 - r0), gap);
});

function center(category: string) {
	return (chart.band(category) ?? 0) + half;
}
function fadeOpacity(pos: number) {
	if (chart.activeIndex === null) return 1;
	const distance = Math.abs(pos - center(chart.categories[chart.activeIndex] ?? ""));
	return distance < 50 ? 0 : distance < 70 ? (distance - 50) / 20 : 1;
}
</script>

<g data-slot={side === "x" ? "bar-x-axis" : "bar-y-axis"} class={className}>
	{#if categoryAxis}
		{#each chart.categories as category, i (category)}
			{#if i % step === 0}
				{@const text = labelFormatter ? labelFormatter(category) : category}
				{#if side === "x"}
					<text
						class={styles.category()}
						x={center(category)}
						y={chart.innerHeight + chart.margin.bottom - 12}
						style:opacity={fadeOpacity(center(category))}
						style:transition="opacity 400ms cubic-bezier(0.42, 0, 0.58, 1)"
					>
						{text}
					</text>
				{:else}
					<text
						class={cn(styles.category(), chart.activeIndex === i && "fill-foreground")}
						x={-8}
						y={center(category)}
						dominant-baseline="middle"
						style:opacity={chart.activeIndex === i ? 1 : 0.7}
					>
						{text}
					</text>
				{/if}
			{/if}
		{/each}
	{:else}
		{#each ticks as tick (tick)}
			{@const pos = chart.value(tick)}
			<text
				class={styles.tick()}
				style:transform={side === "y"
					? `translate(-8px, ${pos}px)`
					: `translate(${pos}px, ${chart.innerHeight + chart.margin.bottom - 12}px)`}
				style:transition={slide}
				dominant-baseline={side === "y" ? "middle" : undefined}
			>
				{tickFormatter ? tickFormatter(tick) : root.format.compact(tick)}
			</text>
		{/each}
	{/if}
</g>
