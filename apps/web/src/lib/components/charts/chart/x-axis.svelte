<svelte:options namespace="svg" />

<script lang="ts">
import { useActivePoint, usePlot } from "./context";
import { evenTickIndices, toDate } from "./core";
import { CHART_DURATION, CHART_EASE_CSS } from "./motion";
import { chartAxis } from "./variants";

let {
	tickCount = 5,
	tickFormatter,
	tickLine = false,
	clearance = 50,
	class: className,
}: {
	tickCount?: number;
	tickFormatter?: (date: Date) => string;
	tickLine?: boolean;
	/** Labels within this many px of the crosshair fade out so the date pill can read. */
	clearance?: number;
	class?: string;
} = $props();

const plot = usePlot();
const pointer = useActivePoint();
const slide = `transform ${CHART_DURATION.update}ms ${CHART_EASE_CSS}`;
const fadeBuffer = 20;
const styles = $derived(chartAxis({ tickLine }));
const indices = $derived(
	evenTickIndices(
		plot.data.length,
		tickCount,
		(i) => {
			const datum = plot.data[i];
			return datum ? plot.x(datum) : i;
		},
		(i) => plot.labels[i] ?? "",
	),
);

function opacityAt(px: number, index: number): number {
	const active = pointer.active;
	if (!active) return 1;
	const distance = Math.abs(px - active.x);
	if (distance < clearance || index === active.index) return 0;
	if (distance < clearance + fadeBuffer) return (distance - clearance) / fadeBuffer;
	return 1;
}
</script>

<g data-slot="chart-x-axis" class={className}>
	{#each indices as index (toDate(plot.data[index]?.[plot.xKey]).getTime())}
		{@const datum = plot.data[index]}
		{#if datum}
			{@const px = plot.x(datum)}
			<g style:transform="translate({px}px, {plot.innerHeight}px)" style:transition={slide}>
				<line class={styles.line()} y2={4} />
				<text
					class={styles.tick()}
					y={plot.margin.bottom - 12}
					text-anchor="middle"
					style:opacity={opacityAt(px, index)}
					style:transition="opacity 400ms cubic-bezier(0.42, 0, 0.58, 1)"
				>
					{tickFormatter ? tickFormatter(toDate(datum[plot.xKey])) : plot.labels[index]}
				</text>
			</g>
		{/if}
	{/each}
</g>
