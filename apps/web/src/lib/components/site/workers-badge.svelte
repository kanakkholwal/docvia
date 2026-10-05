<script lang="ts">
import { ShimmerText } from "#lib/components/text/shimmer-text/index.ts";
import { ArrowRight } from "@lucide/svelte";

// baby-ui's landing badge: a rotating beam shows through a 1px ring around the pill.
let { label, href }: { label: string; href: string } = $props();
</script>

<a
	{href}
	class="group relative inline-flex w-fit rounded-full bg-hairline-strong p-px text-xs text-ink transition-[scale] duration-(--duration-fast) ease-(--ease-out) active:scale-(--press-scale)"
>
	<span aria-hidden="true" class="beam absolute inset-0 rounded-full"></span>
	<span aria-hidden="true" class="beam absolute -inset-1 rounded-full opacity-50 blur-md"></span>
	<span class="relative inline-flex items-center gap-2 rounded-full bg-canvas py-1 pr-3 pl-1">
		<span class="inline-flex items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">
			<span aria-hidden="true" class="dot size-1.5 rounded-full bg-primary-foreground"></span>
			Workers
		</span>
		<ShimmerText as="span" text={label} />
		<ArrowRight class="size-3.5 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
	</span>
</a>

<style>
	/* Registered so the conic gradient's start angle can animate. */
	@property --beam-angle {
		syntax: "<angle>";
		inherits: false;
		initial-value: 0deg;
	}
	.beam {
		background: conic-gradient(
			from var(--beam-angle),
			transparent 0% 65%,
			var(--brand) 82%,
			color-mix(in oklch, var(--brand) 40%, var(--ink)) 90%,
			transparent 100%
		);
		animation: beam-spin 3s linear infinite;
	}
	.dot {
		animation: dot-pulse 1.6s var(--ease-out) infinite;
	}
	@keyframes beam-spin {
		to {
			--beam-angle: 360deg;
		}
	}
	@keyframes dot-pulse {
		0% {
			box-shadow: 0 0 0 0 color-mix(in oklch, var(--primary-foreground) 70%, transparent);
		}
		100% {
			box-shadow: 0 0 0 5px transparent;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.beam,
		.dot {
			animation: none;
		}
	}
</style>
