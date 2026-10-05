<svelte:options namespace="svg" />

<script lang="ts">
import { cn } from "#lib/cn.js";
import { useCartesian } from "./context";
import { fittedTicks, Y_TICK_GAP } from "./core";
import {
	CHART_DURATION,
	CHART_EASE_CSS,
	type Playback,
	prefersReducedMotion,
	tween,
} from "./motion";
import { type ChartGridVariant, chartGrid } from "./variants";

let {
	variant = "dashed",
	horizontal = true,
	vertical = false,
	rows = 5,
	columns = 10,
	fade = true,
	shimmer = true,
	class: className,
}: {
	variant?: ChartGridVariant;
	horizontal?: boolean;
	vertical?: boolean;
	/** Tick-count hint for rows; d3 may return a nearby count. */
	rows?: number;
	columns?: number;
	/** Fade row ends into the plot edges. */
	fade?: boolean;
	/** Sweep a highlight band across the rows while the chart is loading. */
	shimmer?: boolean;
	class?: string;
} = $props();

const SHIMMER_LENGTH = 140;
const SHIMMER_CYCLE = 2200;

const plot = useCartesian();
const uid = $props.id();
const maskId = `${uid}-grid-fade`;
const slide = `transform ${CHART_DURATION.update}ms ${CHART_EASE_CSS}`;
const line = $derived(cn(chartGrid({ variant }), className));
const shimmering = $derived(
	shimmer && horizontal && plot.phase === "loading" && plot.innerWidth > 0,
);
const rowTicks = $derived(
	horizontal && plot.rowScale
		? fittedTicks(plot.rowScale, rows, plot.innerHeight, Y_TICK_GAP)
		: [],
);
let gradient = $state<SVGLinearGradientElement | null>(null);

$effect(() => {
	const width = plot.innerWidth;
	if (!shimmering || prefersReducedMotion()) return;
	let playback: Playback | null = null;
	const cycle = () => {
		playback = tween({
			duration: SHIMMER_CYCLE,
			onUpdate: (p) => {
				const x = -SHIMMER_LENGTH + p * (width + SHIMMER_LENGTH * 2);
				gradient?.setAttribute("gradientTransform", `translate(${x}, 0)`);
			},
			onComplete: cycle,
		});
	};
	cycle();
	return () => playback?.stop();
});
</script>

{#snippet rowLines(stroke?: string)}
	{#each rowTicks as tick (String(tick))}
		<line
			class={line}
			{stroke}
			x1={0}
			x2={plot.innerWidth}
			y1={0}
			y2={0}
			style:transform="translateY({plot.rowScale?.(tick) ?? 0}px)"
			style:transition={slide}
		/>
	{/each}
{/snippet}

<g data-slot="chart-grid">
	<defs>
		{#if horizontal && fade}
			<linearGradient id="{maskId}-g" x1="0%" x2="100%" y1="0%" y2="0%">
				<stop offset="0%" stop-color="white" stop-opacity={0} />
				<stop offset="10%" stop-color="white" stop-opacity={1} />
				<stop offset="90%" stop-color="white" stop-opacity={1} />
				<stop offset="100%" stop-color="white" stop-opacity={0} />
			</linearGradient>
			<mask id={maskId}>
				<rect width={plot.innerWidth} height={plot.innerHeight} fill="url(#{maskId}-g)" />
			</mask>
		{/if}
		{#if shimmering}
			<linearGradient
				bind:this={gradient}
				id="{maskId}-shimmer"
				gradientUnits="userSpaceOnUse"
				x1={0}
				x2={SHIMMER_LENGTH}
				y1={0}
				y2={0}
				class="text-foreground/70"
			>
				<stop offset="0%" stop-color="currentColor" stop-opacity={0} />
				<stop offset="35%" stop-color="currentColor" stop-opacity={0.45} />
				<stop offset="50%" stop-color="currentColor" stop-opacity={1} />
				<stop offset="65%" stop-color="currentColor" stop-opacity={0.45} />
				<stop offset="100%" stop-color="currentColor" stop-opacity={0} />
			</linearGradient>
		{/if}
	</defs>
	{#if horizontal}
		<g mask={fade ? `url(#${maskId})` : undefined}>
			{@render rowLines()}
			{#if shimmering}
				<g data-slot="chart-grid-shimmer">{@render rowLines(`url(#${maskId}-shimmer)`)}</g>
			{/if}
		</g>
	{/if}
	{#if vertical && plot.columnScale}
		{#each plot.columnScale.ticks(columns) as tick (String(tick))}
			{@const x = plot.columnScale(tick)}
			<line class={line} x1={x} x2={x} y1={0} y2={plot.innerHeight} />
		{/each}
	{/if}
</g>
