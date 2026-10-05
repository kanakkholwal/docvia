<svelte:options namespace="svg" />

<script lang="ts">
import { depthFaces } from "./bar-core";
import BarPulse from "./bar-pulse.svelte";
import { type DisplayedBar, useBarChart } from "./context";

let {
	d,
	color,
	glass,
	base,
	pulse,
	side,
	lid,
}: {
	d: DisplayedBar;
	color: string;
	glass: string;
	base: number;
	pulse: boolean;
	side: string;
	lid: string;
} = $props();

const chart = useBarChart();
const vertical = $derived(chart.orientation === "vertical");
const axis = $derived({
	orientation: chart.orientation,
	negative: d.target.value < 0,
	base,
});
const faces = $derived(
	depthFaces(d.rect, {
		...axis,
		center: (vertical ? chart.innerWidth : chart.innerHeight) / 2,
		step: chart.band.step(),
		bandwidth: chart.band.bandwidth(),
	}),
);
const front = $derived(faces?.front ?? d.rect);
</script>

{#if faces}
	<path d={faces.side} fill={color} class={side} />
{/if}
<rect
	x={front.x}
	y={front.y}
	width={Math.max(0, front.width)}
	height={Math.max(0, front.height)}
	fill={color}
/>
<rect
	x={front.x}
	y={front.y}
	width={Math.max(0, front.width)}
	height={Math.max(0, front.height)}
	fill={glass}
/>
{#if faces}
	<path d={faces.lid} fill={color} class={lid} />
{/if}
{#if pulse && front.height > 0 && front.width > 0}
	<BarPulse rect={front} {axis} />
{/if}
