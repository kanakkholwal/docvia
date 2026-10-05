<svelte:options namespace="svg" />

<script lang="ts">
import { untrack } from "svelte";
import { useChart } from "#lib/components/charts/chart/context.js";
import { seriesColor } from "#lib/components/charts/chart/core.js";
import { cn } from "#lib/cn.js";
import BarDepth from "./bar-depth.svelte";
import BarSquares from "./bar-squares.svelte";
import { useBarChart } from "./context";
import { type BarLineCap, barChart } from "./variants";

let {
	dataKey,
	fill,
	lineCap = "round",
	texture = false,
	class: className,
}: {
	dataKey: string;
	/** Defaults to the series colour from the chart config, `var(--color-<dataKey>)`. */
	fill?: string;
	lineCap?: BarLineCap;
	/** Hatch the bars (45° or 135° by series order) so series read without colour. */
	texture?: boolean;
	class?: string;
} = $props();

const chart = useBarChart();
const root = useChart();
const uid = $props.id();
const color = $derived(fill ?? seriesColor(dataKey));
$effect(() => {
	const next = { key: dataKey, color };
	return untrack(() => chart.register(next));
});

const vertical = $derived(chart.orientation === "vertical");
const styles = $derived(
	barChart({
		orientation: chart.orientation,
		variant: chart.variant,
		lineCap,
		entrance: chart.entrance,
	}),
);
const seriesIndex = $derived(
	Math.max(
		0,
		chart.series.findIndex((s) => s.key === dataKey),
	),
);
const bars = $derived(
	[...chart.displayed.values()].filter((d) => d.target.series === dataKey),
);
const base = $derived(chart.value(0));
</script>

<g data-slot="chart-bar" data-series={dataKey}>
	<defs>
		{#if texture}
			<pattern
				id="{uid}-hatch"
				width={6}
				height={6}
				patternUnits="userSpaceOnUse"
				patternTransform="rotate({seriesIndex % 2 === 0 ? 45 : 135})"
			>
				<path d="M0 0V6" class="stroke-background/60" stroke-width={1.5} />
			</pattern>
		{/if}
		{#if chart.variant === "depth"}
			<linearGradient id="{uid}-glass" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="white" stop-opacity={0.2} />
				<stop offset="30%" stop-color="white" stop-opacity={0} />
				<stop offset="100%" stop-color="black" stop-opacity={0.12} />
			</linearGradient>
		{/if}
	</defs>
	{#each bars as d (d.target.key)}
		{@const dimmed =
			(chart.activeIndex !== null && d.target.index !== chart.activeIndex) ||
			(root.highlighted !== null && root.highlighted !== dataKey)}
		{@const fade = chart.entrance === "fade" ? d.progress : 1}
		{@const thickness = vertical ? d.rect.width : d.rect.height}
		{@const radius = lineCap === "round" && d.target.cap ? Math.min(thickness / 2, 8) : 0}
		<g
			class={cn(styles.bar(), className)}
			style:opacity={(dimmed ? 0.3 : 1) * fade}
			style:filter={fade < 1 ? `blur(${(1 - fade) * 2}px)` : undefined}
		>
			{#if chart.variant === "squares"}
				<BarSquares {d} {vertical} {color} />
			{:else if chart.variant === "depth"}
				<BarDepth
					{d}
					{color}
					glass="url(#{uid}-glass)"
					{base}
					pulse={chart.activeIndex === d.target.index}
					side={styles.side()}
					lid={styles.lid()}
				/>
			{:else}
				<rect
					x={d.rect.x}
					y={d.rect.y}
					width={Math.max(0, d.rect.width)}
					height={Math.max(0, d.rect.height)}
					rx={radius}
					fill={color}
				/>
			{/if}
			{#if texture && chart.variant !== "squares"}
				<rect
					x={d.rect.x}
					y={d.rect.y}
					width={Math.max(0, d.rect.width)}
					height={Math.max(0, d.rect.height)}
					rx={radius}
					fill="url(#{uid}-hatch)"
				/>
			{/if}
		</g>
	{/each}
</g>
