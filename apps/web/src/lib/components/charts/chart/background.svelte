<svelte:options namespace="svg" />

<script lang="ts">
import { cn } from "#lib/cn.js";
import { useCartesian } from "./context";
import { type ChartBackgroundVariant, chartBackground } from "./variants";

let {
	variant = "dots",
	class: className,
}: { variant?: ChartBackgroundVariant; class?: string } = $props();

const plot = useCartesian();
const uid = $props.id();
const id = `${uid}-bg`;
</script>

<g
	data-slot="chart-background"
	class={cn(chartBackground({ variant }), className)}
	style:opacity={plot.phase === "ready" || plot.phase === "revealing" ? 1 : 0}
>
	<defs>
		{#if variant === "gradient"}
			<linearGradient {id} x1="0%" x2="0%" y1="0%" y2="100%">
				<stop offset="0%" stop-color="currentColor" stop-opacity={1} />
				<stop offset="100%" stop-color="currentColor" stop-opacity={0} />
			</linearGradient>
		{:else}
			<pattern {id} width={12} height={12} patternUnits="userSpaceOnUse">
				{#if variant === "dots"}
					<circle cx={6} cy={6} r={1} fill="currentColor" />
				{:else if variant === "lines"}
					<path d="M0 12 12 0" stroke="currentColor" stroke-width={1} />
				{:else if variant === "grid"}
					<path d="M12 0H0V12" fill="none" stroke="currentColor" stroke-width={1} />
				{/if}
			</pattern>
		{/if}
	</defs>
	<rect width={plot.innerWidth} height={plot.innerHeight} fill="url(#{id})" />
</g>
