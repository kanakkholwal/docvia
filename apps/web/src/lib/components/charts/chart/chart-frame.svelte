<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "#lib/cn.js";
import { useChart } from "./context";
import { type ChartPhase, isLoadingPhase } from "./core";
import { chart } from "./variants";

let {
	roleDescription,
	summary,
	table,
	count,
	activeIndex,
	onActiveChange,
	interactive,
	announcement,
	phase,
	onKey,
	class: className,
	children,
}: {
	/** Announced after the chart's name, e.g. "line chart". */
	roleDescription: string;
	summary: string;
	table: { columns: string[]; rows: { header: string; cells: string[] }[] };
	/** Items the keyboard walks through: points, slices, cells. */
	count: number;
	activeIndex: number | null;
	onActiveChange: (index: number | null, fromKeyboard: boolean) => void;
	interactive: boolean;
	/** Read out after keyboard moves only; pointer moves stay quiet. */
	announcement: string;
	phase?: ChartPhase;
	/** Runs before the default keys; return true when it handled the event. */
	onKey?: (event: KeyboardEvent) => boolean;
	class?: string;
	children: Snippet<[{ width: number; height: number; el: HTMLDivElement | null }]>;
} = $props();

const chartContext = useChart();
const uid = $props.id();
const styles = chart();
let el = $state<HTMLDivElement | null>(null);
let width = $state(0);
let height = $state(0);
let fromKeyboard = false;

$effect(() => {
	const node = el;
	if (!node) return;
	const measure = () => {
		width = Math.floor(node.clientWidth);
		height = Math.floor(node.clientHeight);
	};
	measure();
	const observer = new ResizeObserver(measure);
	observer.observe(node);
	return () => observer.disconnect();
});

function onkeydown(event: KeyboardEvent) {
	if (!interactive || count === 0) return;
	if (onKey?.(event)) {
		event.preventDefault();
		fromKeyboard = true;
		return;
	}
	const last = count - 1;
	const step = Math.max(1, Math.ceil(count / 10));
	const current = activeIndex;
	let next: number | null;
	switch (event.key) {
		case "ArrowRight":
		case "ArrowDown":
			next = current === null ? 0 : Math.min(last, current + 1);
			break;
		case "ArrowLeft":
		case "ArrowUp":
			next = current === null ? last : Math.max(0, current - 1);
			break;
		case "PageDown":
			next = Math.min(last, (current ?? -1) + step);
			break;
		case "PageUp":
			next = Math.max(0, (current ?? last + 1) - step);
			break;
		case "Home":
			next = 0;
			break;
		case "End":
			next = last;
			break;
		case "Escape":
			if (current === null) return;
			next = null;
			break;
		default:
			return;
	}
	event.preventDefault();
	fromKeyboard = true;
	onActiveChange(next, true);
}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	bind:this={el}
	data-slot="chart-plot"
	data-phase={phase}
	aria-busy={phase && isLoadingPhase(phase) ? "true" : undefined}
	role="figure"
	aria-roledescription={roleDescription}
	aria-labelledby="{uid}-title"
	aria-describedby="{uid}-summary"
	tabindex="0"
	{onkeydown}
	onpointerdown={() => (fromKeyboard = false)}
	onblur={() => {
		if (fromKeyboard && activeIndex !== null) onActiveChange(null, true);
	}}
	class={cn(styles.plot(), className)}
>
	<span id="{uid}-title" class={styles.srOnly()}>{chartContext.title}</span>
	{#if width > 0 && height > 0}
		{@render children({ width, height, el })}
	{/if}
	<p id="{uid}-summary" class={styles.srOnly()}>{summary}</p>
	<table class={styles.srOnly()}>
		<caption>{chartContext.title}</caption>
		<thead>
			<tr>
				{#each table.columns as column (column)}
					<th scope="col">{column}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each table.rows as row, index (index)}
				<tr>
					<th scope="row">{row.header}</th>
					{#each row.cells as cell, i (i)}
						<td>{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<div aria-live="polite" class={styles.srOnly()}>{announcement}</div>
</div>
