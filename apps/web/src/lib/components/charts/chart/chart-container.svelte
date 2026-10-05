<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "#lib/cn.js";
import ChartStyle from "./chart-style.svelte";
import { type ChartConfig, setChart } from "./context";
import { createFormatters } from "./core";
import { type ChartAspect, chart } from "./variants";

let {
	id,
	config,
	title = "Chart",
	description,
	locale,
	aspect = "video",
	hiddenSeries = $bindable([]),
	onHiddenSeriesChange,
	class: className,
	children,
	...rest
}: {
	config: ChartConfig;
	/** Accessible name for the chart; also the data table caption. */
	title?: string;
	/** Replaces the generated screen-reader summary. */
	description?: string;
	/** BCP 47 locale for dates and numbers. Defaults to the reader's own. */
	locale?: string;
	aspect?: ChartAspect;
	hiddenSeries?: string[];
	onHiddenSeriesChange?: (hidden: string[]) => void;
	class?: string;
	children?: Snippet;
} & Omit<HTMLAttributes<HTMLDivElement>, "title"> = $props();

const uid = $props.id();
const chartId = $derived(`chart-${id ?? uid}`);
const format = $derived(createFormatters(locale));
const hidden = $derived(new Set(hiddenSeries));
let highlighted = $state<string | null>(null);

setChart({
	get id() {
		return chartId;
	},
	get config() {
		return config;
	},
	get format() {
		return format;
	},
	get title() {
		return title;
	},
	get description() {
		return description;
	},
	get hidden() {
		return hidden;
	},
	toggleSeries(key: string) {
		const next = hidden.has(key)
			? hiddenSeries.filter((k) => k !== key)
			: [...hiddenSeries, key];
		hiddenSeries = next;
		onHiddenSeriesChange?.(next);
	},
	get highlighted() {
		return highlighted;
	},
	set highlighted(key: string | null) {
		highlighted = key;
	},
});
</script>

<div
	data-slot="chart"
	data-chart={chartId}
	class={cn(chart({ aspect }).root(), className)}
	{...rest}
>
	<ChartStyle id={chartId} {config} />
	{@render children?.()}
</div>
