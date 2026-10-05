<script lang="ts">
import type { Snippet } from "svelte";
import ChartFrame from "#lib/components/charts/chart/chart-frame.svelte";
import { useChart } from "#lib/components/charts/chart/context.js";
import type { ChartStatus, Datum, Margin, TooltipRow } from "#lib/components/charts/chart/core.js";
import { announceRows } from "#lib/components/charts/chart/core.js";
import {
	createAnimatedDomain,
	createChartPhase,
	createSeriesRegistry,
} from "#lib/components/charts/chart/lifecycle.svelte.js";
import { barDomain, categoryOf, summarizeBars } from "./bar-core";
import BarPlot from "./bar-plot.svelte";
import type { BarEntrance, BarOrientationVariant, BarVariant } from "./variants";

let {
	data,
	xKey = "name",
	xLabel = "Category",
	orientation = "vertical",
	variant = "bar",
	entrance = "grow",
	stacked = false,
	barGap = 0.2,
	groupGap = 4,
	stackGap = 0,
	margin,
	status = "ready",
	animate = true,
	activeIndex = $bindable(null),
	onActiveIndexChange,
	roleDescription = "bar chart",
	class: className,
	children: content,
}: {
	data: Datum[];
	/** Key holding each row's category label. */
	xKey?: string;
	/** Header of the category column in the screen-reader table. */
	xLabel?: string;
	orientation?: BarOrientationVariant;
	/** Flat bars, stacked square cells, or glass blocks with perspective depth. */
	variant?: BarVariant;
	entrance?: BarEntrance;
	stacked?: boolean;
	/** Gap between categories as a fraction of the band. */
	barGap?: number;
	/** Pixels between grouped bars in one category. */
	groupGap?: number;
	/** Pixels between stacked segments. */
	stackGap?: number;
	margin?: Partial<Margin>;
	status?: ChartStatus;
	animate?: boolean;
	activeIndex?: number | null;
	onActiveIndexChange?: (index: number | null) => void;
	/** Announced after the chart's name, e.g. "bar chart". */
	roleDescription?: string;
	class?: string;
	children?: Snippet;
} = $props();

const NO_HIDDEN: ReadonlySet<string> = new Set();
const chart = useChart();
const uid = $props.id();
const registry = createSeriesRegistry(() => NO_HIDDEN);
const visible = $derived(registry.series.filter((s) => !chart.hidden.has(s.key)));
const visibleKeys = $derived(visible.map((s) => s.key).join("|"));
const target = $derived(
	barDomain(data, visibleKeys ? visibleKeys.split("|") : [], stacked),
);
const lifecycle = createChartPhase(
	() => status,
	() => animate,
);
// svelte-ignore state_referenced_locally
const domain = createAnimatedDomain({
	target: () => target,
	phase: () => lifecycle.phase,
	loading: status === "loading",
	animate: () => animate,
	advance: lifecycle.advance,
});
let instant = $state(false);
const interactive = $derived(lifecycle.phase === "ready" && data.length > 0);

function setActive(index: number | null, fromKeyboard: boolean) {
	instant = fromKeyboard;
	activeIndex = index;
	onActiveIndexChange?.(index);
}

function seriesLabel(key: string) {
	const label = chart.config[key]?.label;
	return typeof label === "string" ? label : key;
}
const title = (datum: Datum) => categoryOf(datum, xKey);
const rows = (datum: Datum): TooltipRow[] =>
	visible.map((s) => {
		const value = datum[s.key];
		return {
			key: s.key,
			label: seriesLabel(s.key),
			color: s.color,
			value: typeof value === "number" ? value : null,
		};
	});
const activeDatum = $derived(
	activeIndex !== null && interactive ? data[activeIndex] : undefined,
);
const announcement = $derived(
	activeDatum && instant
		? announceRows(title(activeDatum), rows(activeDatum), chart.format.number)
		: "",
);
const summary = $derived(
	chart.description ??
		summarizeBars({
			data,
			xKey,
			series: visible.map((s) => ({ key: s.key, label: seriesLabel(s.key) })),
			format: chart.format,
		}),
);
const table = $derived({
	columns: [xLabel, ...visible.map((s) => seriesLabel(s.key))],
	rows: data.map((datum) => ({
		header: title(datum),
		cells: visible.map((s) => {
			const value = datum[s.key];
			return typeof value === "number" ? chart.format.number(value) : "";
		}),
	})),
});
</script>

<ChartFrame
	{roleDescription}
	{summary}
	{table}
	count={data.length}
	{activeIndex}
	onActiveChange={setActive}
	{interactive}
	{announcement}
	phase={lifecycle.phase}
	class={className}
>
	{#snippet children(frame)}
		<BarPlot
			{frame}
			{data}
			{xKey}
			{orientation}
			{variant}
			{entrance}
			{stacked}
			{barGap}
			{groupGap}
			{stackGap}
			{margin}
			domain={domain.value}
			series={registry.series}
			register={registry.register}
			hidden={chart.hidden}
			phase={lifecycle.phase}
			{animate}
			advance={lifecycle.advance}
			activeIndex={interactive ? activeIndex : null}
			{instant}
			{interactive}
			{setActive}
			{title}
			{rows}
			{uid}
		>
			{@render content?.()}
		</BarPlot>
	{/snippet}
</ChartFrame>
