<script lang="ts">
import { scaleBand, scaleLinear } from "d3-scale";
import { type Snippet, untrack } from "svelte";
import { setActivePoint, setCartesian, type TickScale } from "#lib/components/charts/chart/context.js";
import type {
	ActivePoint,
	ChartPhase,
	Datum,
	Domain,
	Margin,
	SeriesConfig,
	TooltipRow,
} from "#lib/components/charts/chart/core.js";
import { hoverThrottle } from "#lib/components/charts/chart/core.js";
import { CHART_EASE, tween } from "#lib/components/charts/chart/motion.js";
import {
	type BarRect,
	barLayout,
	categoryOf,
	collapsed,
	ENTER_MS,
	enterSpan,
	lerpRect,
	nearestBand,
	type Rect,
	staggerDelay,
	UPDATE_MS,
} from "./bar-core";
import BarSkeleton from "./bar-skeleton.svelte";
import { type DisplayedBar, setBarChart } from "./context";
import type { BarEntrance, BarOrientationVariant, BarVariant } from "./variants";

let {
	frame,
	data,
	xKey,
	orientation,
	variant,
	entrance,
	stacked,
	barGap,
	groupGap,
	stackGap,
	margin: marginProp,
	domain,
	series,
	register,
	hidden,
	phase,
	animate,
	advance,
	activeIndex,
	instant,
	interactive,
	setActive,
	title,
	rows,
	uid,
	children,
}: {
	frame: { width: number; height: number; el: HTMLDivElement | null };
	data: Datum[];
	xKey: string;
	orientation: BarOrientationVariant;
	variant: BarVariant;
	entrance: BarEntrance;
	stacked: boolean;
	barGap: number;
	groupGap: number;
	stackGap: number;
	margin?: Partial<Margin>;
	domain: Domain;
	series: SeriesConfig[];
	register: (series: SeriesConfig) => () => void;
	hidden: ReadonlySet<string>;
	phase: ChartPhase;
	animate: boolean;
	advance: (event: "done") => void;
	activeIndex: number | null;
	instant: boolean;
	interactive: boolean;
	setActive: (index: number | null, fromKeyboard: boolean) => void;
	title: (datum: Datum) => string;
	rows: (datum: Datum) => TooltipRow[];
	uid: string;
	children?: Snippet;
} = $props();

const BAR_MARGIN: Margin = { top: 16, right: 16, bottom: 32, left: 44 };
const margin = $derived<Margin>({ ...BAR_MARGIN, ...marginProp });
const innerWidth = $derived(Math.max(0, frame.width - margin.left - margin.right));
const innerHeight = $derived(Math.max(0, frame.height - margin.top - margin.bottom));
const vertical = $derived(orientation === "vertical");
const categories = $derived(data.map((d) => categoryOf(d, xKey)));
const band = $derived(
	scaleBand<string>()
		.domain(categories)
		.range([0, vertical ? innerWidth : innerHeight])
		.padding(barGap),
);
const value = $derived(
	scaleLinear()
		.domain(domain)
		.range(vertical ? [innerHeight, 0] : [0, innerWidth]),
);
const keys = $derived(series.map((s) => s.key));
const targets = $derived(
	barLayout({
		data,
		xKey,
		keys,
		hidden,
		orientation,
		stacked,
		band,
		value,
		groupGap,
		stackGap,
	}),
);
const base = $derived(value(0));

let clock = $state(0);
const span = $derived(enterSpan(data.length, variant === "squares"));
$effect.pre(() => {
	const current = phase;
	if (current !== "revealing" && current !== "concealing") return;
	return untrack(() => {
		const reveal = current === "revealing";
		const total = span;
		clock = reveal ? 0 : total;
		const playback = tween({
			duration: animate ? total : 0,
			ease: (t) => t,
			onUpdate: (p) => {
				clock = reveal ? p * total : (1 - p) * total;
			},
			onComplete: () => advance("done"),
		});
		return () => playback.stop();
	});
});

// Data, layout and visibility changes morph; the value domain already tweens on its own.
const signature = $derived(
	`${orientation}|${stacked}|${variant}|${innerWidth}x${innerHeight}|${keys.join(",")}|${[
		...hidden,
	].join(",")}|${data.map((d) => keys.map((k) => String(d[k])).join(",")).join(";")}`,
);
let morph = $state(1);
let from = new Map<string, Rect>();
let shown = new Map<string, Rect>();
let shownTargets = new Map<string, BarRect>();
let fromTargets = new Map<string, BarRect>();
// svelte-ignore state_referenced_locally
let prevSignature = signature;
$effect.pre(() => {
	const next = signature;
	return untrack(() => {
		if (prevSignature === next) return;
		prevSignature = next;
		if (phase !== "ready" || !animate) {
			morph = 1;
			return;
		}
		from = new Map(shown);
		fromTargets = new Map(shownTargets);
		morph = 0;
		const playback = tween({
			duration: UPDATE_MS,
			onUpdate: (p) => {
				morph = p;
			},
		});
		return () => playback.stop();
	});
});

const displayed = $derived.by(() => {
	const map = new Map<string, DisplayedBar>();
	for (const target of targets) {
		const start = collapsed(target, orientation, base);
		if (phase === "revealing" || phase === "concealing") {
			const elapsed = clock - staggerDelay(target.index, data.length);
			const progress = CHART_EASE(Math.min(1, Math.max(0, elapsed / ENTER_MS)));
			const rect =
				entrance === "fade"
					? target
					: lerpRect(start, target, variant === "squares" ? 1 : progress);
			map.set(target.key, { target, rect, progress, elapsed });
		} else if (phase === "ready") {
			const origin = from.get(target.key) ?? start;
			map.set(target.key, {
				target,
				rect: morph >= 1 ? target : lerpRect(origin, target, morph),
				progress: 1,
				elapsed: null,
			});
		}
	}
	// Bars whose category left the data shrink back to the baseline, mirroring the grow.
	if (phase === "ready" && morph < 1) {
		for (const [key, origin] of from) {
			const target = fromTargets.get(key);
			if (map.has(key) || !target) continue;
			const rect = lerpRect(origin, collapsed(origin, orientation, base), morph);
			map.set(key, { target, rect, progress: 1, elapsed: null });
		}
	}
	return map;
});
$effect.pre(() => {
	shown = new Map([...displayed].map(([key, d]) => [key, d.rect]));
	shownTargets = new Map([...displayed].map(([key, d]) => [key, d.target]));
});

const hover = hoverThrottle();
function onpointermove(event: PointerEvent & { currentTarget: SVGSVGElement }) {
	if (!interactive) return;
	const bounds = event.currentTarget.getBoundingClientRect();
	const pos = vertical
		? event.clientX - bounds.left - margin.left
		: event.clientY - bounds.top - margin.top;
	const index = nearestBand(band, categories, pos);
	hover.move(index, (next) => {
		if (next !== activeIndex) setActive(next, false);
	});
}
function onpointerleave() {
	hover.cancel();
	if (activeIndex !== null) setActive(null, false);
}

const active = $derived.by<ActivePoint | null>(() => {
	if (activeIndex === null) return null;
	const datum = data[activeIndex];
	if (!datum) return null;
	const center = (band(categories[activeIndex] ?? "") ?? 0) + band.bandwidth() / 2;
	return { index: activeIndex, datum, x: center, y: {} };
});
const visibleSeries = $derived(series.filter((s) => !hidden.has(s.key)));

setCartesian({
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
		return vertical ? (value as unknown as TickScale) : undefined;
	},
	get columnScale() {
		return vertical ? undefined : (value as unknown as TickScale);
	},
	get phase() {
		return phase;
	},
	get animate() {
		return animate;
	},
	get clipId() {
		return `${uid}-clip`;
	},
	get plotEl() {
		return frame.el;
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
setBarChart({
	get data() {
		return data;
	},
	get xKey() {
		return xKey;
	},
	get orientation() {
		return orientation;
	},
	get variant() {
		return variant;
	},
	get entrance() {
		return entrance;
	},
	get stacked() {
		return stacked;
	},
	get band() {
		return band;
	},
	get value() {
		return value;
	},
	get categories() {
		return categories;
	},
	get displayed() {
		return displayed;
	},
	get series() {
		return visibleSeries;
	},
	register: (s: SeriesConfig) => register(s),
	get phase() {
		return phase;
	},
	get activeIndex() {
		return activeIndex;
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
	get plotEl() {
		return frame.el;
	},
	get width() {
		return frame.width;
	},
	get height() {
		return frame.height;
	},
	get uid() {
		return uid;
	},
});
</script>

<svg
	aria-hidden="true"
	width={frame.width}
	height={frame.height}
	class="absolute inset-0 block overflow-visible"
	{onpointermove}
	{onpointerleave}
>
	<g transform="translate({margin.left},{margin.top})">
		<rect width={innerWidth} height={innerHeight} fill="transparent" />
		<BarSkeleton />
		{@render children?.()}
	</g>
</svg>
