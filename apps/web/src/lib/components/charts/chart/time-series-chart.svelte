<script lang="ts" module>
import { getContext, setContext } from "svelte";

/** Extra room a part needs beyond the data: x in epoch ms, y in value units. */
export interface ChartExtent {
	x?: [number, number];
	y?: [number, number];
}

const EXTENTS = Symbol("chart-extents");

/** Lets a part such as ProjectionLine widen the x and y domains; returns an unregister. */
export function useExtentRegistry(): (id: string, extent: ChartExtent) => () => void {
	return getContext(EXTENTS) ?? (() => () => {});
}
</script>

<script lang="ts">
import { type Snippet, untrack } from "svelte";
import ChartFrame from "./chart-frame.svelte";
import { useChart } from "./context";
import {
	announceRows,
	type ChartSelection,
	type ChartStatus,
	type Datum,
	type Margin,
	resolveDomain,
	selectionBetween,
	summarize,
	toDate,
} from "./core";
import {
	createAnimatedDomain,
	createChartPhase,
	createSeriesRegistry,
} from "./lifecycle.svelte";
import TimeSeriesPlot from "./time-series-plot.svelte";

let {
	data: allData,
	xDomain,
	xKey = "date",
	xLabel = "Date",
	margin,
	status = "ready",
	animate = true,
	activeIndex = $bindable(null),
	onActiveIndexChange,
	selection = $bindable(null),
	onSelectionChange,
	roleDescription,
	class: className,
	children: content,
}: {
	data: Datum[];
	/** Visible date window, e.g. from ChartBrush; y-domain and interaction follow it. */
	xDomain?: [Date, Date];
	/** Key holding each row's date. */
	xKey?: string;
	/** Header of the date column in the screen-reader table. */
	xLabel?: string;
	margin?: Partial<Margin>;
	status?: ChartStatus;
	animate?: boolean;
	/** Range picked by dragging across the plot or Shift+Arrow. */
	selection?: ChartSelection | null;
	onSelectionChange?: (selection: ChartSelection | null) => void;
	activeIndex?: number | null;
	onActiveIndexChange?: (index: number | null) => void;
	roleDescription: string;
	class?: string;
	children?: Snippet;
} = $props();

const chart = useChart();
const uid = $props.id();
const registry = createSeriesRegistry(() => chart.hidden);
const seriesKeys = $derived(registry.series.map((s) => s.key).join("|"));
const EXTENT_KEY = "__extent";
const windowStart = $derived(xDomain?.[0].getTime());
const windowEnd = $derived(xDomain?.[1].getTime());
const data = $derived.by(() => {
	const start = windowStart;
	const end = windowEnd;
	if (start === undefined || end === undefined) return allData;
	return allData.filter((d) => {
		const time = toDate(d[xKey]).getTime();
		return time >= start && time <= end;
	});
});
let extents = $state<Map<string, ChartExtent>>(new Map());
setContext(EXTENTS, (id: string, extent: ChartExtent) => {
	extents = new Map(untrack(() => extents)).set(id, extent);
	return () => {
		const next = new Map(untrack(() => extents));
		next.delete(id);
		extents = next;
	};
});
const target = $derived.by(() => {
	const keys = seriesKeys ? seriesKeys.split("|") : [];
	const extra = [...extents.values()].flatMap((e) =>
		e.y ? e.y.map((value) => ({ [EXTENT_KEY]: value })) : [],
	);
	if (!extra.length) return resolveDomain(data, keys);
	return resolveDomain([...data, ...extra], [...keys, EXTENT_KEY]);
});
const extentMax = $derived.by(() => {
	const ends = [...extents.values()].flatMap((e) => (e.x ? [e.x[1]] : []));
	return ends.length ? Math.max(...ends) : undefined;
});
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

let selectionSpoken = $state(false);
function setSelection(next: ChartSelection | null, fromKeyboard: boolean) {
	selectionSpoken = fromKeyboard;
	selection = next;
	onSelectionChange?.(next);
}
// The fixed end of a keyboard selection; the active index is the moving end.
let anchor: number | null = null;
function onKey(event: KeyboardEvent) {
	if (event.key === "Escape" && selection) {
		anchor = null;
		setSelection(null, true);
		return true;
	}
	if (!event.shiftKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight"))
		return false;
	const from = activeIndex ?? 0;
	if (anchor === null || !selection) anchor = from;
	const step = event.key === "ArrowRight" ? 1 : -1;
	const moving = Math.min(data.length - 1, Math.max(0, from + step));
	setActive(moving, true);
	setSelection(moving === anchor ? null : selectionBetween(anchor, moving), true);
	return true;
}

function seriesLabel(key: string) {
	const label = chart.config[key]?.label;
	return typeof label === "string" ? label : key;
}
const title = (datum: Datum) => chart.format.title(toDate(datum[xKey]));
const rows = (datum: Datum) =>
	registry.series.map((s) => {
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
const range = $derived(selection ? [data[selection.start], data[selection.end]] : null);
const announcement = $derived(
	selectionSpoken && range?.[0] && range[1]
		? `${title(range[0])} to ${title(range[1])}: ${rows(range[0])
				.map((r, i) => {
					const to = rows(range[1] as Datum)[i]?.value;
					return `${r.label} ${r.value === null ? "" : chart.format.number(r.value)} to ${to == null ? "" : chart.format.number(to)}`;
				})
				.join(", ")}`
		: activeDatum && instant
		? announceRows(title(activeDatum), rows(activeDatum), chart.format.number)
		: "",
);
const summary = $derived(
	chart.description ??
		summarize({
			data,
			xKey,
			series: registry.series.map((s) => ({ key: s.key, label: seriesLabel(s.key) })),
			format: chart.format,
		}),
);
const table = $derived({
	columns: [xLabel, ...registry.series.map((s) => seriesLabel(s.key))],
	rows: data.map((datum) => ({
		header: title(datum),
		cells: registry.series.map((s) => {
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
	{onKey}
	class={className}
>
	{#snippet children(frame)}
		<TimeSeriesPlot
			{frame}
			{data}
			xExtent={windowStart !== undefined && windowEnd !== undefined
				? [windowStart, windowEnd]
				: undefined}
			{extentMax}
			{xKey}
			{margin}
			domain={domain.value}
			series={registry.series}
			register={registry.register}
			phase={lifecycle.phase}
			{animate}
			advance={lifecycle.advance}
			clipId="{uid}-reveal"
			{activeIndex}
			{instant}
			{interactive}
			{setActive}
			{selection}
			{setSelection}
			{title}
			{rows}
		>
			{@render content?.()}
		</TimeSeriesPlot>
	{/snippet}
</ChartFrame>
