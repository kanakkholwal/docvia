<svelte:options namespace="svg" />

<script lang="ts">
import { type Playback, prefersReducedMotion, tween } from "#lib/components/charts/chart/motion.js";
import { SWEEP_MS, SWEEP_STOPS, skeletonHeights } from "./bar-core";
import { useBarChart } from "./context";
import { barChart } from "./variants";

const SKELETON_BARS = 12;
const chart = useBarChart();
const styles = barChart();
let tick = $state(0);
let sweep = $state<SVGRectElement | null>(null);
const loading = $derived(chart.phase === "loading");
const reduced = typeof window !== "undefined" && prefersReducedMotion();

$effect(() => {
	if (!loading || reduced) return;
	let playback: Playback | null = null;
	let rolled = false;
	const cycle = () => {
		rolled = false;
		playback = tween({
			duration: SWEEP_MS,
			ease: (t) => t,
			onUpdate: (p) => {
				const x = -1 + 3 * p;
				sweep?.setAttribute("x", String(x));
				if (!rolled && x >= 1) {
					rolled = true;
					tick += 1;
				}
			},
			onComplete: cycle,
		});
	};
	cycle();
	return () => playback?.stop();
});

const count = $derived(chart.categories.length || SKELETON_BARS);
const heights = $derived(skeletonHeights(count, tick));
const step = $derived(
	(chart.orientation === "vertical" ? chart.innerWidth : chart.innerHeight) / count,
);
const width = $derived(chart.categories.length ? chart.band.bandwidth() : step * 0.7);
function start(i: number) {
	return chart.categories.length
		? (chart.band(chart.categories[i] ?? "") ?? 0) + (chart.band.bandwidth() - width) / 2
		: i * step + (step - width) / 2;
}
</script>

<g
	data-slot="bar-skeleton"
	style:opacity={loading ? 1 : 0}
	style:transition="opacity 450ms cubic-bezier(0.85,0,0.15,1)"
>
	{#if loading && !reduced}
		<defs>
			<linearGradient id="{chart.uid}-sweep">
				{#each SWEEP_STOPS as stop (stop.offset)}
					<stop offset={stop.offset} stop-color="white" stop-opacity={stop.opacity} />
				{/each}
			</linearGradient>
			<pattern
				id="{chart.uid}-sweep-p"
				width={3}
				height={1}
				patternUnits="objectBoundingBox"
				patternContentUnits="objectBoundingBox"
				patternTransform="rotate(25)"
			>
				<rect bind:this={sweep} x={-1} width={1} height={1} fill="url(#{chart.uid}-sweep)" />
			</pattern>
			<mask id="{chart.uid}-sweep-m">
				<rect
					width={chart.innerWidth}
					height={chart.innerHeight}
					fill="url(#{chart.uid}-sweep-p)"
				/>
			</mask>
		</defs>
	{/if}
	{#if loading}
		<g mask={reduced ? undefined : `url(#${chart.uid}-sweep-m)`} opacity={0.45}>
			{#each heights as h, i (i)}
				{#if chart.orientation === "vertical"}
					<rect
						class={styles.skeleton()}
						x={start(i)}
						y={chart.innerHeight * (1 - h)}
						{width}
						height={chart.innerHeight * h}
						rx={2}
					/>
				{:else}
					<rect
						class={styles.skeleton()}
						x={0}
						y={start(i)}
						width={chart.innerWidth * h}
						height={width}
						rx={2}
					/>
				{/if}
			{/each}
		</g>
	{/if}
</g>
