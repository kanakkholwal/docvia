import { bisector } from "d3-array";
import { scaleLinear } from "d3-scale";
import { type CurveFactory, line as d3Line } from "d3-shape";

export type Datum = Record<string, unknown>;
export type Domain = [number, number];

export interface Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** Shape shared by both ports; each port narrows `label`/`icon` to its own node type. */
export type ChartConfigEntry = {
	label?: unknown;
	icon?: unknown;
} & (
	| { color?: string; theme?: never }
	| { color?: never; theme: Record<"light" | "dark", string> }
);

export type ChartConfigShape = Record<string, ChartConfigEntry>;

export interface SeriesConfig {
	key: string;
	color: string;
}

export interface ActivePoint {
	index: number;
	datum: Datum;
	/** Plot-space x of the datum. */
	x: number;
	/** Plot-space y per visible series key. */
	y: Record<string, number>;
}

export interface TooltipRow {
	key: string;
	label: string;
	color: string;
	value: number | null;
}

/** Inclusive index range picked by dragging or Shift+Arrow; `start <= end` always. */
export interface ChartSelection {
	start: number;
	end: number;
}

export function selectionBetween(a: number, b: number): ChartSelection {
	return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export type ChartStatus = "loading" | "ready";

/** Lifecycle: the series conceals, the grid retweens, then the series reveals. */
export type ChartPhase =
	| "loading"
	| "gridTweenReady"
	| "revealing"
	| "ready"
	| "concealing"
	| "gridTweenLoading";

export const DEFAULT_MARGIN: Margin = {
	top: 16,
	right: 16,
	bottom: 32,
	left: 44,
};
export const LOADING_DOMAIN: Domain = [0, 100];
const DOMAIN_TWEEN_THRESHOLD = 0.02;

export function chartStyleCss(id: string, config: ChartConfigShape): string {
	const entries = Object.entries(config).filter(
		([, entry]) => entry.theme ?? entry.color,
	);
	if (!entries.length) return "";
	const block = (theme: "light" | "dark") =>
		entries
			.map(([key, entry]) => {
				const color = entry.theme?.[theme] ?? entry.color;
				return color ? `  --color-${key}: ${color};` : "";
			})
			.filter(Boolean)
			.join("\n");
	return `[data-chart=${id}] {\n${block("light")}\n}\n.dark [data-chart=${id}] {\n${block("dark")}\n}`;
}

export const seriesColor = (key: string) => `var(--color-${key})`;

export function toDate(value: unknown): Date {
	return value instanceof Date ? value : new Date(value as string | number);
}

/** Domain rule: non-negative data sits on zero with 10% headroom, mixed data pads 5%. */
export function resolveDomain(data: Datum[], keys: string[]): Domain {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const datum of data) {
		for (const key of keys) {
			const value = datum[key];
			if (typeof value !== "number" || !Number.isFinite(value)) continue;
			if (value < min) min = value;
			if (value > max) max = value;
		}
	}
	if (min === Number.POSITIVE_INFINITY) return niceDomain(LOADING_DOMAIN);
	if (min >= 0) return niceDomain([0, max <= 0 ? 100 : max * 1.1]);
	const pad = (max - min) * 0.05 || 1;
	return niceDomain([min - pad, max + pad]);
}

export function niceDomain(domain: Domain): Domain {
	const [a, b] = scaleLinear().domain(domain).nice().domain();
	return [a ?? domain[0], b ?? domain[1]];
}

export function shouldTweenDomain(from: Domain, to: Domain): boolean {
	const span = Math.max(
		Math.abs(to[1] - to[0]),
		Math.abs(from[1] - from[0]),
		1,
	);
	return (
		Math.abs(to[0] - from[0]) / span >= DOMAIN_TWEEN_THRESHOLD ||
		Math.abs(to[1] - from[1]) / span >= DOMAIN_TWEEN_THRESHOLD
	);
}

export function lerpDomain(from: Domain, to: Domain, t: number): Domain {
	return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

export interface PathPoint {
	key: string;
	x: number;
	y: number;
}

export function seriesPoints(
	data: Datum[],
	key: string,
	x: (datum: Datum) => number,
	y: (value: number) => number,
	xKey: string,
): PathPoint[] {
	const points: PathPoint[] = [];
	data.forEach((datum, index) => {
		const value = datum[key];
		if (typeof value !== "number" || !Number.isFinite(value)) return;
		points.push({
			key: String(toDate(datum[xKey]).getTime() || index),
			x: x(datum),
			y: y(value),
		});
	});
	return points;
}

/** Lerps by x key; a new point grows out of its previous neighbour's old position. */
export function interpolatePoints(
	from: PathPoint[],
	to: PathPoint[],
	t: number,
): PathPoint[] {
	if (t >= 1 || from.length === 0) return to;
	const byKey = new Map(from.map((point) => [point.key, point]));
	return to.map((target, index) => {
		const source =
			byKey.get(target.key) ??
			(index > 0 ? byKey.get(to[index - 1]?.key ?? "") : undefined) ??
			(index < to.length - 1
				? byKey.get(to[index + 1]?.key ?? "")
				: undefined) ??
			from[0] ??
			target;
		return {
			key: target.key,
			x: source.x + (target.x - source.x) * t,
			y: source.y + (target.y - source.y) * t,
		};
	});
}

export function linePath(points: PathPoint[], curve: CurveFactory): string {
	if (points.length === 0) return "";
	return (
		d3Line<PathPoint>()
			.x((point) => point.x)
			.y((point) => point.y)
			.curve(curve)(points) ?? ""
	);
}

export function nearestIndex(
	data: Datum[],
	xKey: string,
	time: number,
): number {
	if (data.length === 0) return -1;
	const index = bisector<Datum, number>((datum) =>
		toDate(datum[xKey]).getTime(),
	).left(data, time, 1);
	const before = data[index - 1];
	const after = data[index];
	if (!before) return 0;
	if (!after) return index - 1;
	const beforeTime = toDate(before[xKey]).getTime();
	const afterTime = toDate(after[xKey]).getTime();
	return time - beforeTime > afterTime - time ? index : index - 1;
}

/** Screen-reader line for the active point, e.g. `Mar 3: Revenue 120, Cost 80`. */
export function announceRows(
	title: string,
	rows: TooltipRow[],
	number: (value: number) => string,
): string {
	return `${title}: ${rows.map((r) => `${r.label} ${r.value === null ? "" : number(r.value)}`).join(", ")}`;
}

/** Coalesces pointer moves into one active-index commit per animation frame. */
export function hoverThrottle() {
	let pending: {
		index: number;
		commit: (index: number) => void;
		frame: number;
	} | null = null;
	return {
		move(index: number, commit: (index: number) => void) {
			if (pending) {
				pending.index = index;
				pending.commit = commit;
				return;
			}
			const next = { index, commit, frame: 0 };
			next.frame = requestAnimationFrame(() => {
				pending = null;
				next.commit(next.index);
			});
			pending = next;
		},
		cancel() {
			if (pending) cancelAnimationFrame(pending.frame);
			pending = null;
		},
	};
}

export type FadeEdges = boolean | "left" | "right";

/** Opacity stops 0/15/85/100 across the plot width, matching the series fade. */
export function fadeStops(
	fade: FadeEdges,
): { offset: string; opacity: number }[] {
	const left = fade === true || fade === "left";
	const right = fade === true || fade === "right";
	return [
		{ offset: "0%", opacity: left ? 0 : 1 },
		{ offset: "15%", opacity: 1 },
		{ offset: "85%", opacity: 1 },
		{ offset: "100%", opacity: right ? 0 : 1 },
	];
}

export interface Formatters {
	tick: (date: Date) => string;
	title: (date: Date) => string;
	number: (value: number) => string;
	compact: (value: number) => string;
	/** Takes a ratio: 0.278 formats as 27.8%. */
	percent: (ratio: number) => string;
	month: (date: Date) => string;
	day: (date: Date) => string;
}

export function createFormatters(locale?: string): Formatters {
	const tick = new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
	});
	const title = new Intl.DateTimeFormat(locale, {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
	const month = new Intl.DateTimeFormat(locale, { month: "short" });
	const day = new Intl.DateTimeFormat(locale, { day: "numeric" });
	const number = new Intl.NumberFormat(locale);
	const compact = new Intl.NumberFormat(locale, {
		notation: "compact",
		maximumFractionDigits: 1,
	});
	const percent = new Intl.NumberFormat(locale, {
		style: "percent",
		maximumFractionDigits: 1,
	});
	return {
		percent: (ratio) => percent.format(ratio),
		tick: (date) => tick.format(date),
		title: (date) => title.format(date),
		number: (value) => number.format(value),
		compact: (value) => compact.format(value),
		month: (date) => month.format(date),
		day: (date) => day.format(date),
	};
}

function toIndices(gaps: number[]): number[] {
	const indices = [0];
	for (const gap of gaps) indices.push((indices.at(-1) ?? 0) + gap);
	return indices;
}

function indicesForCount(length: number, count: number): number[] {
	const span = length - 1;
	const raw = Array.from({ length: count }, (_, i) =>
		Math.round((i / (count - 1)) * span),
	);
	return [...new Set([0, ...raw, span])].sort((a, b) => a - b);
}

function layoutScore(
	indices: number[],
	px: (index: number) => number,
	target: number,
): number {
	const gaps = indices
		.slice(1)
		.map((index, i) => px(index) - px(indices[i] ?? 0));
	const min = Math.min(...gaps);
	const max = Math.max(...gaps);
	const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
	const indexGaps = indices
		.slice(1)
		.map((index, i) => index - (indices[i] ?? 0));
	const smallest = indexGaps.indexOf(Math.min(...indexGaps));
	const interior = smallest > 0 && smallest < indexGaps.length - 1 ? 0.08 : 0;
	const symmetry =
		indexGaps.reduce(
			(sum, gap, i) => sum + Math.abs(gap - (indexGaps.at(-1 - i) ?? gap)),
			0,
		) / indexGaps.length;
	return (
		(mean > 0 ? (max - min) / mean : max - min) +
		0.1 * Math.abs(indices.length - target) +
		interior +
		symmetry * 0.02
	);
}

function compositions(sum: number, parts: number): number[][] {
	if (parts === 1) return sum >= 1 ? [[sum]] : [];
	const out: number[][] = [];
	for (let gap = 1; gap <= sum - (parts - 1); gap++) {
		for (const tail of compositions(sum - gap, parts - 1))
			out.push([gap, ...tail]);
	}
	return out;
}

/** The tick picker tries every gap layout for target +-1 ticks and keeps the most even. */
export function evenTickIndices(
	length: number,
	target: number,
	px: (index: number) => number,
	label: (index: number) => string,
): number[] {
	if (length <= 0) return [];
	if (length <= target) return Array.from({ length }, (_, i) => i);
	let best = indicesForCount(length, target);
	let bestScore = layoutScore(best, px, target);
	for (
		let count = Math.max(2, target - 1);
		count <= Math.min(length, target + 1);
		count++
	) {
		const gaps = count - 1;
		let binomial = 1;
		for (let i = 0; i < gaps - 1; i++)
			binomial = (binomial * (length - 2 - i)) / (i + 1);
		const layouts =
			binomial > 400
				? [indicesForCount(length, count)]
				: compositions(length - 1, gaps).map((parts) => toIndices(parts));
		for (const layout of layouts) {
			const seen = new Set<string>();
			const indices = layout.filter((index) => {
				const text = label(index);
				if (seen.has(text)) return false;
				seen.add(text);
				return true;
			});
			if (indices.length < 2) continue;
			const score = layoutScore(indices, px, target);
			if (score < bestScore - 1e-6) {
				best = indices;
				bestScore = score;
			}
		}
	}
	return best;
}

/** Gaps an 11px tick label needs so neighbours never touch: stacked, and side by side. */
export const Y_TICK_GAP = 22;
export const X_TICK_GAP = 44;

/** Caps a tick-count hint to what `span` px can hold at `minGap` apart; never below 2. */
export function fitTickCount(
	requested: number,
	span: number,
	minGap: number,
): number {
	const room = Math.floor(span / minGap) + 1;
	return Math.max(2, Math.min(10, requested, room));
}

/** Ticks at least `minGap` px apart. d3 treats the count as a hint and can return more
 * ("nice" steps), so the hint drops until the real ticks fit. */
export function fittedTicks<T>(
	scale: { ticks: (count: number) => T[] },
	requested: number,
	span: number,
	minGap: number,
): T[] {
	let count = fitTickCount(requested, span, minGap);
	let ticks = scale.ticks(count);
	while (count > 2 && ticks.length > 1 && span / (ticks.length - 1) < minGap) {
		count -= 1;
		ticks = scale.ticks(count);
	}
	return ticks;
}

/** Plain-language description read before the data table; `describe` overrides it. */
export function summarize(options: {
	data: Datum[];
	xKey: string;
	series: { key: string; label: string }[];
	format: Formatters;
}): string {
	const { data, xKey, series, format } = options;
	if (data.length === 0 || series.length === 0) return "No data.";
	const first = format.title(toDate(data[0]?.[xKey]));
	const last = format.title(toDate(data.at(-1)?.[xKey]));
	const parts = series.map(({ key, label }) => {
		const values = data
			.map((d) => d[key])
			.filter((v): v is number => typeof v === "number");
		if (!values.length) return `${label}: no values.`;
		return `${label} ranges from ${format.number(Math.min(...values))} to ${format.number(
			Math.max(...values),
		)}, ending at ${format.number(values.at(-1) ?? 0)}.`;
	});
	return `${data.length} points from ${first} to ${last}. ${parts.join(" ")}`;
}

/** Lifecycle step after `event`; `null` means stay. Durations of zero skip their phase. */
export function nextPhase(
	phase: ChartPhase,
	event: "status-ready" | "status-loading" | "done",
): ChartPhase | null {
	if (event === "status-ready") {
		return phase === "loading" ||
			phase === "gridTweenLoading" ||
			phase === "concealing"
			? "gridTweenReady"
			: null;
	}
	if (event === "status-loading") {
		return phase === "ready" || phase === "revealing" ? "concealing" : null;
	}
	switch (phase) {
		case "gridTweenReady":
			return "revealing";
		case "revealing":
			return "ready";
		case "concealing":
			return "gridTweenLoading";
		case "gridTweenLoading":
			return "loading";
		default:
			return null;
	}
}

export const isLoadingPhase = (phase: ChartPhase) =>
	phase === "loading" || phase === "gridTweenLoading";
export const seriesVisibleInPhase = (phase: ChartPhase) =>
	phase === "revealing" || phase === "ready" || phase === "concealing";
