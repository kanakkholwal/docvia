<script lang="ts">
import { cn } from "#lib/cn.js";
import { type ShimmerTextSize, shimmerText } from "./variants";

let {
	text,
	durationMs = 2000,
	spread = 2,
	size = "inherit",
	as = "p",
	class: className,
}: {
	text: string;
	/** One sweep across the text, in ms. */
	durationMs?: number;
	/** Band half-width in px per character, so long text gets a wider band. */
	spread?: number;
	size?: ShimmerTextSize;
	as?: string;
	class?: string;
} = $props();
</script>

<svelte:element
	this={as}
	data-slot="shimmer-text"
	class={cn(shimmerText({ size }), className)}
	style:--shimmer-spread="{text.length * spread}px"
	style:--shimmer-duration="{durationMs}ms">{text}</svelte:element
>
