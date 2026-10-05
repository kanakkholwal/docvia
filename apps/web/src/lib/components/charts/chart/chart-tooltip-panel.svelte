<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "#lib/cn.js";
import { portal, setActivePoint, useActivePoint } from "./context";
import type { ActivePoint } from "./core";
import { CHART_SPRING, Spring } from "./motion";
import { chartTooltip } from "./variants";

let {
	anchor,
	instant,
	bounds,
	target,
	class: className,
	children,
}: {
	/** Point the panel sits beside, in plot-element pixels; null hides it. */
	anchor: { x: number; y: number } | null;
	instant: boolean;
	/** Plot size, so the panel flips and clamps inside it. */
	bounds: { width: number; height: number };
	/** Element the panel portals into, normally the chart plot. */
	target: HTMLElement;
	class?: string;
	children: Snippet;
} = $props();

const BOX_OFFSET = 16;
const pointer = useActivePoint();
let last: ActivePoint | null = null;
const shownPoint = $derived.by(() => {
	if (pointer.active) last = pointer.active;
	return pointer.active ?? last;
});
setActivePoint({
	get active() {
		return shownPoint;
	},
	get instant() {
		return pointer.instant;
	},
	get title() {
		return pointer.title;
	},
	get rows() {
		return pointer.rows;
	},
});

let outer = $state<HTMLDivElement | null>(null);
let panel = $state<HTMLDivElement | null>(null);
let flipped = $state(false);
let size = { w: 180, h: 80 };
const left = new Spring(0, CHART_SPRING.tooltipBox, (v) => {
	if (outer) outer.style.left = `${v}px`;
});
const top = new Spring(0, CHART_SPRING.tooltipBox, (v) => {
	if (outer) outer.style.top = `${v}px`;
});
const entrance = new Spring(0, CHART_SPRING.panel, (p) => {
	if (!panel) return;
	const offset = (1 - p) * (panel.dataset.flipped === "true" ? 20 : -20);
	panel.style.transform = `translateX(${offset}px) scale(${0.85 + 0.15 * p})`;
	panel.style.opacity = String(Math.min(1, Math.max(0, p)));
});

let shown = false;
$effect(() => {
	const point = anchor;
	const jump = instant;
	if (point === null) {
		shown = false;
		return;
	}
	if (outer) size = { w: outer.offsetWidth || 180, h: outer.offsetHeight || 80 };
	const flip = point.x + size.w + BOX_OFFSET > bounds.width;
	const tx = flip ? point.x - BOX_OFFSET - size.w : point.x + BOX_OFFSET;
	const ty = Math.max(
		BOX_OFFSET,
		Math.min(point.y - size.h / 2, bounds.height - size.h - BOX_OFFSET),
	);
	if (!shown || jump) {
		left.jump(tx);
		top.jump(ty);
	} else {
		left.set(tx);
		top.set(ty);
	}
	if (!shown || flip !== flipped) {
		if (panel) panel.dataset.flipped = String(flip);
		entrance.jump(0);
		entrance.set(1);
		flipped = flip;
	}
	shown = true;
});
$effect(() => () => {
	left.stop();
	top.stop();
	entrance.stop();
});
</script>

<div
	{@attach portal(target)}
	bind:this={outer}
	data-slot="chart-tooltip"
	data-open={anchor ? "" : undefined}
	aria-hidden="true"
	class="pointer-events-none absolute z-30 opacity-0 transition-opacity duration-[var(--duration-exit)] ease-[var(--ease-out)] data-open:opacity-100 data-open:duration-(--duration-instant)"
>
	<div
		bind:this={panel}
		class={cn(chartTooltip().panel(), className)}
		style:transform-origin={flipped ? "right top" : "left top"}
	>
		{@render children()}
	</div>
</div>
