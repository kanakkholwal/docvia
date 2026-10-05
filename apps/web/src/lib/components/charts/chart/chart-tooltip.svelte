<svelte:options namespace="svg" />

<script lang="ts">
import type { Snippet } from "svelte";
import ChartDatePill from "./chart-date-pill.svelte";
import ChartTooltipContent from "./chart-tooltip-content.svelte";
import ChartTooltipDot from "./chart-tooltip-dot.svelte";
import ChartTooltipPanel from "./chart-tooltip-panel.svelte";
import { useActivePoint, usePlot } from "./context";
import { follow } from "./follow.svelte";
import { CHART_SPRING, Spring } from "./motion";

let {
	content,
	cursor = true,
	dots = true,
	datePill = true,
	class: className,
}: {
	/** Panel body; defaults to `<ChartTooltipContent />`. */
	content?: Snippet;
	/** Vertical crosshair that follows the active point. */
	cursor?: boolean;
	dots?: boolean;
	/** Date ticker pinned under the crosshair. */
	datePill?: boolean;
	class?: string;
} = $props();

const plot = usePlot();
const pointer = useActivePoint();
const uid = $props.id();
const gradientId = `${uid}-crosshair`;
let crosshair = $state<SVGRectElement | null>(null);
const crosshairX = new Spring(0, CHART_SPRING.tooltip, (v) =>
	crosshair?.setAttribute("x", String(v - 0.5)),
);
follow(
	crosshairX,
	() => (crosshair && pointer.active ? pointer.active.x : null),
	() => pointer.instant,
);
</script>

{#if cursor && pointer.active}
	<g data-slot="chart-cursor" class="pointer-events-none text-muted-foreground">
		<defs>
			<linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
				<stop offset="0%" stop-color="currentColor" stop-opacity={0} />
				<stop offset="10%" stop-color="currentColor" stop-opacity={1} />
				<stop offset="90%" stop-color="currentColor" stop-opacity={1} />
				<stop offset="100%" stop-color="currentColor" stop-opacity={0} />
			</linearGradient>
		</defs>
		<rect bind:this={crosshair} width={1} height={plot.innerHeight} fill="url(#{gradientId})" />
	</g>
{/if}
{#if dots}
	{#each plot.series as s (s.key)}
		<ChartTooltipDot
			color={s.color}
			x={pointer.active ? pointer.active.x : null}
			y={pointer.active ? (pointer.active.y[s.key] ?? null) : null}
			instant={pointer.instant}
		/>
	{/each}
{/if}
{#if plot.plotEl}
	<ChartTooltipPanel
		target={plot.plotEl}
		anchor={pointer.active ? { x: pointer.active.x + plot.margin.left, y: plot.margin.top } : null}
		instant={pointer.instant}
		bounds={{ width: plot.width, height: plot.height }}
		class={className}
	>
		{#if content}
			{@render content()}
		{:else}
			<ChartTooltipContent />
		{/if}
	</ChartTooltipPanel>
	{#if datePill}
		<ChartDatePill target={plot.plotEl} />
	{/if}
{/if}
