<script lang="ts">
import { cn } from "#lib/cn.js";
import { rollSwap, rollSwapSlide, rollSwapTilt, swapChars, tiltTiming } from "./swap";
import {
	ROLL_DONE,
	type RollStagger,
	type RollTextMotion,
	type RollTextSize,
	rollText,
} from "./variants";

let {
	text,
	groupHover = false,
	disabled = false,
	stagger = "none",
	staggerMs = 32,
	durationMs = 450,
	size = "md",
	motion = "slide",
	to,
	active: activeProp,
	defaultActive = false,
	onActiveChange,
	class: classProp,
}: {
	text: string;
	groupHover?: boolean;
	disabled?: boolean;
	stagger?: RollStagger;
	staggerMs?: number;
	durationMs?: number;
	size?: RollTextSize;
	motion?: RollTextMotion;
	/** A second label: hover previews it and click toggles to it, turning the roll into a swap. */
	to?: string;
	/** Controlled swap state when `to` is set. */
	active?: boolean;
	defaultActive?: boolean;
	onActiveChange?: (active: boolean) => void;
	class?: string;
} = $props();

// svelte-ignore state_referenced_locally -- one-time seed, matching React's useState(initialValue)
let ownActive = $state(defaultActive);
const active = $derived(activeProp ?? ownActive);

function toggle() {
	if (activeProp === undefined) ownActive = !active;
	onActiveChange?.(!active);
}

type RollPhase = "closed" | "animating" | "open";
type RollSegment = { key: string; value: string; delay: number };

function splitSegments(t: string, s: RollStagger, step: number): RollSegment[] {
	if (s === "none") return [{ key: "whole", value: t, delay: 0 }];
	if (s === "word") {
		const words = t.trim().split(/\s+/);
		return words.map((word, i) => ({
			key: `${i}-${word}`,
			value: word,
			delay: i * step,
		}));
	}
	return [...t].map((char, i) => ({ key: `${i}-${char}`, value: char, delay: i * step }));
}

const segments = $derived(splitSegments(text, stagger, staggerMs));
let phase = $state<RollPhase>("closed");
let remaining = 0;
let reducedMotion = false;
let rootEl = $state<HTMLSpanElement>();

$effect(() => {
	if (disabled && phase !== "closed") phase = "closed";
});

$effect(() => {
	const media = window.matchMedia("(prefers-reduced-motion: reduce)");
	reducedMotion = media.matches;
	const onChange = (event: MediaQueryListEvent) => {
		reducedMotion = event.matches;
	};
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
});

function playOpen() {
	if (disabled || phase === "animating") return;
	if (reducedMotion) {
		phase = "open";
		return;
	}
	remaining = segments.length;
	if (phase === "open") {
		phase = "closed";
		requestAnimationFrame(() => requestAnimationFrame(() => (phase = "animating")));
		return;
	}
	phase = "animating";
}

$effect(() => {
	if (!groupHover || disabled || !rootEl) return;
	const group = rootEl.closest("[data-roll-group], .group\\/roll");
	if (!group) return;
	group.addEventListener("mouseenter", playOpen);
	group.addEventListener("focusin", playOpen);
	return () => {
		group.removeEventListener("mouseenter", playOpen);
		group.removeEventListener("focusin", playOpen);
	};
});

function onStackAnimationEnd(event: AnimationEvent) {
	if (phase !== "animating" || !ROLL_DONE.has(event.animationName)) return;
	remaining -= 1;
	if (remaining <= 0) phase = "open";
}

const classes = $derived(
	cn(
		rollText({ size, motion }),
		phase === "animating" && "roll-text--animating",
		phase === "open" && "roll-text--open",
		classProp,
	),
);
</script>

{#snippet letters(value: string, layer: "first" | "second")}
	{@const chars = swapChars(value)}
	{@const tilt = rollSwapTilt({ layer, active, hover: !disabled })}
	<span aria-hidden="true" class={tilt.layer()}>
		{#each chars as c, i (i)}
			<span class={tilt.char()} style="--i: {i}; --n: {chars.length}">{c}</span>
		{/each}
	</span>
{/snippet}

{#if to !== undefined}
	{@const slide = rollSwapSlide({ active, hover: !disabled })}
	{@const timing = tiltTiming(durationMs)}
	<button
		type="button"
		data-slot="roll-text"
		data-state={active ? "on" : "off"}
		{disabled}
		aria-label={active ? to : text}
		aria-pressed={active}
		onclick={toggle}
		class={cn(rollText({ size, motion }), rollSwap({ motion }), classProp)}
	>
		{#if motion === "tilt"}
			<span
				class={rollSwapTilt().stage()}
				style="--swap-duration: {timing.letter}ms; --swap-stagger: {staggerMs}ms; --swap-lag: {timing.lag}ms"
			>
				{@render letters(text, "first")}
				{@render letters(to, "second")}
			</span>
		{:else}
			<span aria-hidden="true" class={slide.first()} style="transition-duration: {durationMs}ms">
				{text}
				{#if to.length > text.length}<span class="invisible h-0">{to}</span>{/if}
			</span>
			<span aria-hidden="true" class={slide.second()} style="transition-duration: {durationMs}ms">
				{to}
			</span>
		{/if}
	</button>
{:else}
<!-- svelte-ignore a11y_no_noninteractive_tabindex -- intentionally focusable for keyboard parity with hover; no action to give it a role for, matches the roll's own decorative purpose -->
<!-- svelte-ignore a11y_no_static_element_interactions -- same: the roll is a hover/focus-driven visual only, not a control -->
<span
	bind:this={rootEl}
	data-slot="roll-text"
	tabindex={groupHover ? undefined : 0}
	class={classes}
	onmouseenter={() => !groupHover && !disabled && playOpen()}
	onfocus={() => !groupHover && !disabled && playOpen()}
>
	<span class="sr-only">{text}</span>
	<span class="roll-text__track select-none" aria-hidden="true">
		{#each segments as segment, index (segment.key)}
			{#if stagger === "word" && index > 0}{" "}{/if}
			<span
				class="roll-unit"
				style="--roll-delay: {segment.delay}ms; --roll-unit-duration: {durationMs}ms"
			>
				<span class="roll-unit__sizer" aria-hidden="true">{segment.value}</span>
				<span class="roll-unit__stack" aria-hidden="true" onanimationend={onStackAnimationEnd}>
					<span class="roll-unit__line">{segment.value}</span>
					<span class="roll-unit__line">{segment.value}</span>
				</span>
			</span>
		{/each}
	</span>
</span>
{/if}
