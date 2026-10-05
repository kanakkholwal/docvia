<script lang="ts">
import { extent } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import type { Snippet } from "svelte";
import { setActivePoint, setPlot, type TickScale, useChart } from "./context";
import {
	type ActivePoint,
	type ChartPhase,
	type ChartSelection,
	type Datum,
	DEFAULT_MARGIN,
	type Domain,
	hoverThrottle,
	type Margin,
	nearestIndex,
	type SeriesConfig,
	selectionBetween,
	type TooltipRow,
	toDate,
} from "./core";
import { createRevealClip } from "./lifecycle.svelte";

let {
	frame,
	data,
	xExtent,
	extentMax,
	xKey,
	margin: marginProp,
	domain,
	series,
	register,
	phase,
	animate,
	advance,
	clipId,
	activeIndex,
	instant,
	interactive,
	setActive,
	selection,
	setSelection,
	title,
	rows,
	children,
}: {
	frame: { width: number; height: number; el: HTMLDivElement | null };
	data: Datum[];
	xExtent?: [number, number];
	extentMax?: number;
	xKey: string;
	margin?: Partial<Margin>;
	domain: Domain;
	series: SeriesConfig[];
	register: (series: SeriesConfig) => () => void;
	phase: ChartPhase;
	animate: boolean;
	advance: (event: "done") => void;
	clipId: string;
	activeIndex: number | null;
	instant: boolean;
	interactive: boolean;
	setActive: (index: number | null, fromKeyboard: boolean) => void;
	selection: ChartSelection | null;
	setSelection: (selection: ChartSelection | null, fromKeyboard: boolean) => void;
	title: (datum: Datum) => string;
	rows: (datum: Datum) => TooltipRow[];
	children?: Snippet;
} = $props();

const chart = useChart();
const margin = $derived<Margin>({ ...DEFAULT_MARGIN, ...marginProp });
const innerWidth = $derived(Math.max(0, frame.width - margin.left - margin.right));
const innerHeight = $derived(Math.max(0, frame.height - margin.top - margin.bottom));
const clip = createRevealClip({
	phase: () => phase,
	innerWidth: () => innerWidth,
	animate: () => animate,
	advance: (event) => advance(event),
});

const xScale = $derived.by(() => {
	if (xExtent) return scaleTime().domain(xExtent).range([0, innerWidth]);
	const [min = 0, max = min] = extent(data, (d) => toDate(d[xKey]).getTime());
	return scaleTime()
		.domain([min, Math.max(max, extentMax ?? max)])
		.range([0, innerWidth]);
});
const yScale = $derived(scaleLinear().domain(domain).range([innerHeight, 0]));
const x = $derived((d: Datum) => xScale(toDate(d[xKey])));
const labels = $derived(data.map((d) => chart.format.tick(toDate(d[xKey]))));

const hover = hoverThrottle();
type PlotPointer = PointerEvent & { currentTarget: SVGSVGElement };
let drag: number | null = null;
function indexAt(event: PlotPointer) {
	const bounds = event.currentTarget.getBoundingClientRect();
	const time = xScale.invert(event.clientX - bounds.left - margin.left).getTime();
	return nearestIndex(data, xKey, time);
}
// Touch keeps scrubbing; mouse and pen drag out a range.
function onpointerdown(event: PlotPointer) {
	if (!interactive || event.pointerType === "touch" || event.button !== 0) return;
	drag = indexAt(event);
	event.currentTarget.setPointerCapture(event.pointerId);
}
function onpointerup(event: PlotPointer) {
	if (drag === null) return;
	if (indexAt(event) === drag) setSelection(null, false);
	drag = null;
}
function onpointermove(event: PlotPointer) {
	if (!interactive) return;
	const index = indexAt(event);
	if (drag !== null && index !== drag) {
		setSelection(selectionBetween(drag, index), false);
		if (activeIndex !== null) setActive(null, false);
		return;
	}
	hover.move(index, (next) => {
		if (next !== activeIndex) setActive(next, false);
	});
}
function onpointerleave() {
	if (drag !== null) return;
	hover.cancel();
	if (activeIndex !== null) setActive(null, false);
}

const active = $derived.by<ActivePoint | null>(() => {
	if (activeIndex === null || !interactive) return null;
	const datum = data[activeIndex];
	if (!datum) return null;
	const y: Record<string, number> = {};
	for (const s of series) {
		const value = datum[s.key];
		if (typeof value === "number") y[s.key] = yScale(value);
	}
	return { index: activeIndex, datum, x: x(datum), y };
});

const selectionX = $derived.by<[number, number] | null>(() => {
	const a = selection ? data[selection.start] : undefined;
	const b = selection ? data[selection.end] : undefined;
	return a && b ? [x(a), x(b)] : null;
});

setPlot({
	get width() {
		return frame.width;
	},
	get height() {
		return frame.height;
	},
	get innerWidth() {
		return innerWidth;
	},
	get innerHeight() {
		return innerHeight;
	},
	get margin() {
		return margin;
	},
	get rowScale() {
		return yScale as unknown as TickScale;
	},
	get columnScale() {
		return xScale as unknown as TickScale;
	},
	get phase() {
		return phase;
	},
	get animate() {
		return animate;
	},
	get clipId() {
		return clipId;
	},
	get plotEl() {
		return frame.el;
	},
	get data() {
		return data;
	},
	get xKey() {
		return xKey;
	},
	get xScale() {
		return xScale;
	},
	get yScale() {
		return yScale;
	},
	get x() {
		return x;
	},
	get labels() {
		return labels;
	},
	get series() {
		return series;
	},
	register: (s: SeriesConfig) => register(s),
	get selection() {
		return selection;
	},
	get selectionX() {
		return selectionX;
	},
});
setActivePoint({
	get active() {
		return active;
	},
	get instant() {
		return instant;
	},
	get title() {
		return title;
	},
	get rows() {
		return rows;
	},
});
</script>

<svg
	aria-hidden="true"
	width={frame.width}
	height={frame.height}
	class="absolute inset-0 block overflow-visible"
	style:cursor={interactive ? "crosshair" : undefined}
	{onpointerdown}
	{onpointerup}
	{onpointermove}
	{onpointerleave}
>
	<defs>
		<clipPath id={clipId}>
			<rect
				bind:this={clip.rect}
				x={-clip.pad}
				y={-clip.pad}
				width={clip.width}
				height={innerHeight + clip.pad * 2}
			/>
		</clipPath>
	</defs>
	<g transform="translate({margin.left},{margin.top})">
		<rect width={innerWidth} height={innerHeight} fill="transparent" />
		{@render children?.()}
	</g>
</svg>
