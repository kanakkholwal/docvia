<script lang="ts">
import { portal, useActivePoint, useChart, usePlot } from "./context";
import { toDate } from "./core";
import { follow } from "./follow.svelte";
import { CHART_SPRING, Spring } from "./motion";
import { chartTooltip } from "./variants";

let { target }: { target: HTMLElement } = $props();

const TICKER_ROW = 24;
const COMPACT_TICKER = 60;

const chart = useChart();
const plot = usePlot();
const pointer = useActivePoint();
const styles = chartTooltip();
let pill = $state<HTMLDivElement | null>(null);
let dayStack = $state<HTMLDivElement | null>(null);
let monthStack = $state<HTMLDivElement | null>(null);
const pillLeft = new Spring(0, CHART_SPRING.tooltip, (v) => {
	if (pill) pill.style.left = `${v}px`;
});
follow(
	pillLeft,
	() => (pill && pointer.active ? pointer.active.x + plot.margin.left : null),
	() => pointer.instant,
);
const day = new Spring(0, CHART_SPRING.ticker, (v) => {
	if (dayStack) dayStack.style.transform = `translateY(${v}px)`;
});
const month = new Spring(0, CHART_SPRING.ticker, (v) => {
	if (monthStack) monthStack.style.transform = `translateY(${v}px)`;
});
const compact = $derived(plot.data.length > COMPACT_TICKER);
const ticker = $derived.by(() => {
	const dates = plot.data.map((d) => toDate(d[plot.xKey]));
	const months: { key: string; label: string }[] = [];
	const monthOf: number[] = [];
	dates.forEach((date, i) => {
		const label = chart.format.month(date);
		if (months.at(-1)?.label !== label) months.push({ key: `${label}-${i}`, label });
		monthOf.push(months.length - 1);
	});
	return { days: dates.map((date) => chart.format.day(date)), months, monthOf };
});
let shown = false;
$effect(() => {
	const active = pointer.active;
	const instant = pointer.instant;
	if (!active || compact || !dayStack || !monthStack) {
		shown = false;
		return;
	}
	const dayTarget = -active.index * TICKER_ROW;
	const monthTarget = -(ticker.monthOf[active.index] ?? 0) * TICKER_ROW;
	if (!shown) {
		day.jump(0);
		month.jump(0);
	}
	if (instant) {
		day.jump(dayTarget);
		month.jump(monthTarget);
	} else {
		day.set(dayTarget);
		month.set(monthTarget);
	}
	shown = true;
});
$effect(() => () => {
	day.stop();
	month.stop();
});
</script>

{#if pointer.active}
	{@const active = pointer.active}
	<div
		{@attach portal(target)}
		bind:this={pill}
		data-slot="chart-date-pill"
		aria-hidden="true"
		class="-translate-x-1/2 absolute bottom-1 z-20"
	>
		<div class={styles.pill()}>
			{#if compact}
				<span class="whitespace-nowrap">{plot.labels[active.index]}</span>
			{:else}
				<div class="flex h-6 items-start gap-1 overflow-hidden">
					<div bind:this={monthStack} class="flex flex-col">
						{#each ticker.months as m (m.key)}
							<span class="flex h-6 items-center whitespace-nowrap">{m.label}</span>
						{/each}
					</div>
					<div bind:this={dayStack} class="flex flex-col">
						{#each ticker.days as d, i (i)}
							<span class="flex h-6 items-center justify-center tabular-nums">{d}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
