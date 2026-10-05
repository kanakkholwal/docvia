<script lang="ts">
import type { Component } from "svelte";
import { cn } from "#lib/cn.js";
import Toggle from "#lib/components/ui/toggle/toggle.svelte";
import { useChart } from "./context";
import { seriesColor } from "./core";
import { type ChartLegendAlign, chartLegend } from "./variants";

let {
	align = "center",
	hideIcon = false,
	interactive = true,
	class: className,
}: {
	align?: ChartLegendAlign;
	hideIcon?: boolean;
	/** False renders a static key: for charts whose entries are not series that can hide. */
	interactive?: boolean;
	class?: string;
} = $props();

const chart = useChart();
</script>

{#if !interactive}
	<ul data-slot="chart-legend" aria-label="Legend" class={cn(chartLegend({ align }).root(), className)}>
		{#each Object.entries(chart.config) as [key, entry] (key)}
			{@const styles = chartLegend()}
			{@const Icon = entry.icon as Component | undefined}
			<li class={styles.label()}>
				{#if Icon && !hideIcon}
					<Icon />
				{:else}
					<span aria-hidden="true" class={styles.swatch()} style="--swatch: {seriesColor(key)}"></span>
				{/if}
				{(entry.label as string | undefined) ?? key}
			</li>
		{/each}
	</ul>
{:else}
<div data-slot="chart-legend" class={cn(chartLegend({ align }).root(), className)}>
	{#each Object.entries(chart.config) as [key, entry] (key)}
		{@const styles = chartLegend({ hidden: chart.hidden.has(key) })}
		{@const Icon = entry.icon as Component | undefined}
		<span
			role="presentation"
			class={styles.item()}
			onpointerenter={() => (chart.highlighted = key)}
			onpointerleave={() => (chart.highlighted = null)}
			onfocusin={() => (chart.highlighted = key)}
			onfocusout={() => (chart.highlighted = null)}
		>
			<Toggle
				size="sm"
				bind:pressed={() => !chart.hidden.has(key), () => chart.toggleSeries(key)}
			>
				{#if Icon && !hideIcon}
					<Icon />
				{:else}
					<span aria-hidden="true" class={styles.swatch()} style="--swatch: {seriesColor(key)}"></span>
				{/if}
				{(entry.label as string | undefined) ?? key}
			</Toggle>
		</span>
	{/each}
</div>
{/if}
