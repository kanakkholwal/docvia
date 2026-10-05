<svelte:options namespace="svg" />

<script lang="ts">
import { follow } from "./follow.svelte";
import { CHART_SPRING, Spring } from "./motion";

let {
	color,
	x,
	y,
	instant,
}: { color: string; x: number | null; y: number | null; instant: boolean } = $props();

let circle = $state<SVGCircleElement | null>(null);
const sx = new Spring(0, CHART_SPRING.tooltip, (v) =>
	circle?.setAttribute("cx", String(v)),
);
const sy = new Spring(0, CHART_SPRING.tooltip, (v) =>
	circle?.setAttribute("cy", String(v)),
);
follow(
	sx,
	() => (circle ? x : null),
	() => instant,
);
follow(
	sy,
	() => (circle ? y : null),
	() => instant,
);
</script>

{#if x !== null && y !== null}
	<circle bind:this={circle} r={5} fill={color} class="stroke-background" stroke-width={2} />
{/if}
