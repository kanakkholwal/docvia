<svelte:options namespace="svg" />

<script lang="ts">
import type { Snippet } from "svelte";
import ChartTooltipContent from "#lib/components/charts/chart/chart-tooltip-content.svelte";
import ChartTooltipPanel from "#lib/components/charts/chart/chart-tooltip-panel.svelte";
import { useActivePoint } from "#lib/components/charts/chart/context.js";
import { cn } from "#lib/cn.js";
import { useBarChart } from "./context";
import { barChart } from "./variants";

let {
	content,
	cursor = true,
	class: className,
}: {
	/** Panel body; defaults to `<ChartTooltipContent />`. */
	content?: Snippet;
	/** Soft band behind the hovered category. */
	cursor?: boolean;
	class?: string;
} = $props();

const chart = useBarChart();
const pointer = useActivePoint();
const styles = $derived(barChart({ orientation: chart.orientation }));
const vertical = $derived(chart.orientation === "vertical");
const index = $derived(chart.activeIndex);
const category = $derived(index === null ? undefined : chart.categories[index]);
const step = $derived(chart.band.step());
const start = $derived(category === undefined ? 0 : (chart.band(category) ?? 0));
const pad = $derived((step - chart.band.bandwidth()) / 2);
const anchor = $derived.by(() => {
	if (index === null || category === undefined) return null;
	const rects = [...chart.displayed.values()].filter(
		(d) => d.target.index === index && !d.target.hidden,
	);
	const center = start + chart.band.bandwidth() / 2;
	if (vertical) {
		const top = Math.min(...rects.map((d) => d.rect.y), chart.innerHeight);
		return { x: center + chart.margin.left, y: top + chart.margin.top };
	}
	const end = Math.max(...rects.map((d) => d.rect.x + d.rect.width), 0);
	return { x: end + chart.margin.left, y: center + chart.margin.top };
});
</script>

{#if cursor}
	<rect
		data-slot="bar-cursor"
		class={cn(styles.band(), "transition-opacity duration-(--duration-fast)")}
		x={vertical ? start - pad : 0}
		y={vertical ? 0 : start - pad}
		width={vertical ? step : chart.innerWidth}
		height={vertical ? chart.innerHeight : step}
		style:opacity={index === null ? 0 : 1}
	/>
{/if}
{#if chart.plotEl}
	<ChartTooltipPanel
		target={chart.plotEl}
		{anchor}
		instant={pointer.instant}
		bounds={{ width: chart.width, height: chart.height }}
		class={className}
	>
		{#if content}
			{@render content()}
		{:else}
			<ChartTooltipContent />
		{/if}
	</ChartTooltipPanel>
{/if}
