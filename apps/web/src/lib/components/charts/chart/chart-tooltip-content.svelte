<script lang="ts">
import type { Component, Snippet } from "svelte";
import { useActivePoint, useChart } from "./context";
import type { Datum } from "./core";
import { type ChartTooltipIndicator, chartTooltip } from "./variants";

let {
	indicator = "dot",
	hideLabel = false,
	hideIndicator = false,
	labelKey,
	labelFormatter,
	formatter,
	class: className,
}: {
	indicator?: ChartTooltipIndicator;
	hideLabel?: boolean;
	hideIndicator?: boolean;
	/** Read the title from this key instead of the chart's own label for the datum. */
	labelKey?: string;
	labelFormatter?: Snippet<[{ label: string; datum: Datum }]>;
	formatter?: Snippet<[{ value: number; key: string; datum: Datum }]>;
	class?: string;
} = $props();

const chart = useChart();
const pointer = useActivePoint();
const styles = $derived(chartTooltip({ indicator }));
</script>

{#if pointer.active}
	{@const active = pointer.active}
	{@const label = labelKey ? String(active.datum[labelKey] ?? "") : pointer.title(active.datum)}
	<div class={className}>
		{#if !hideLabel}
			<div class={styles.title()}>
				{#if labelFormatter}
					{@render labelFormatter({ label, datum: active.datum })}
				{:else}
					{label}
				{/if}
			</div>
		{/if}
		<div class={styles.rows()}>
			{#each pointer.rows(active.datum) as row (row.key)}
				{@const Icon = chart.config[row.key]?.icon as Component | undefined}
				<div class={styles.row()}>
					{#if Icon}
						<Icon />
					{:else if !hideIndicator}
						<span class={styles.indicator()} style="--indicator: {row.color}"></span>
					{/if}
					<span class={styles.label()}>{row.label}</span>
					{#if row.value !== null}
						<span class={styles.value()}>
							{#if formatter}
								{@render formatter({ value: row.value, key: row.key, datum: active.datum })}
							{:else}
								{chart.format.number(row.value)}
							{/if}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
