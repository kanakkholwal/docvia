<svelte:options namespace="svg" />

<script lang="ts">
import { type Playback, prefersReducedMotion, tween } from "#lib/components/charts/chart/motion.js";
import { EASE_IN_OUT, PULSE_MS, pulseRect, type Rect } from "./bar-core";

let { rect, axis }: { rect: Rect; axis: Parameters<typeof pulseRect>[1] } = $props();

const uid = $props.id();
let wave = $state<SVGRectElement | null>(null);
const start = $derived(pulseRect(rect, axis, 0));
const vertical = $derived(axis.orientation === "vertical");

/** A white band sweeps base to tip every 2.4s, ease-in-out, clipped to the bar. */
$effect(() => {
	if (prefersReducedMotion()) return;
	let playback: Playback | null = null;
	const cycle = () => {
		playback = tween({
			duration: PULSE_MS,
			ease: EASE_IN_OUT,
			onUpdate: (p) => {
				const next = pulseRect(rect, axis, p);
				wave?.setAttribute("x", String(next.x));
				wave?.setAttribute("y", String(next.y));
			},
			onComplete: cycle,
		});
	};
	cycle();
	return () => playback?.stop();
});
</script>

<g data-slot="bar-pulse">
	<defs>
		<clipPath id="{uid}-clip">
			<rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} />
		</clipPath>
		<linearGradient
			id="{uid}-wave"
			x1="0"
			y1="0"
			x2={vertical ? "0" : "1"}
			y2={vertical ? "1" : "0"}
		>
			<stop offset="0%" stop-color="white" stop-opacity={0} />
			<stop offset="50%" stop-color="white" stop-opacity={0.85} />
			<stop offset="100%" stop-color="white" stop-opacity={0} />
		</linearGradient>
	</defs>
	<rect
		bind:this={wave}
		clip-path="url(#{uid}-clip)"
		x={start.x}
		y={start.y}
		width={start.width}
		height={start.height}
		fill="url(#{uid}-wave)"
	/>
</g>
