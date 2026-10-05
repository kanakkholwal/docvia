import type { ScaleBand, ScaleLinear } from "d3-scale";
import {
	type Datum,
	type Domain,
	type Formatters,
	niceDomain,
} from "#lib/components/charts/chart/core.js";
import { cubicBezier } from "#lib/components/charts/chart/motion.js";
import type { BarOrientationVariant } from "./variants";

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface BarRect extends Rect {
	key: string;
	series: string;
	index: number;
	value: number;
	/** Series switched off in the legend: laid out collapsed at the baseline so it can animate out. */
	hidden: boolean;
	/** Topmost segment of a stack, the only one that gets rounded ends when stacks touch. */
	cap: boolean;
}

export const ENTER_MS = 1100;
export const UPDATE_MS = 500;
/** Spreads the stagger over 40% of the enter duration. */
export const STAGGER_SHARE = 0.4;
export const SQUARE_GAP = 3;
export const PULSE_MS = 2400;
export const SWEEP_MS = 2000;
export const EASE_IN_OUT = cubicBezier(0.42, 0, 0.58, 1);

export const categoryOf = (datum: Datum, xKey: string) =>
	String(datum[xKey] ?? "");

/** Value domain: stacked sums positive and negative parts separately, grouped takes raw extents. */
export function barDomain(
	data: Datum[],
	keys: string[],
	stacked: boolean,
): Domain {
	let min = 0;
	let max = 0;
	for (const datum of data) {
		let up = 0;
		let down = 0;
		for (const key of keys) {
			const value = datum[key];
			if (typeof value !== "number" || !Number.isFinite(value)) continue;
			if (stacked) {
				if (value >= 0) up += value;
				else down += value;
			} else {
				up = Math.max(up, value);
				down = Math.min(down, value);
			}
		}
		max = Math.max(max, up);
		min = Math.min(min, down);
	}
	if (max === 0 && min === 0) return niceDomain([0, 100]);
	const pad = (max - min) * 0.1;
	return niceDomain([min < 0 ? min - pad : 0, max > 0 ? max + pad : 0]);
}

export function barLayout(options: {
	data: Datum[];
	xKey: string;
	keys: string[];
	hidden: ReadonlySet<string>;
	orientation: BarOrientationVariant;
	stacked: boolean;
	band: ScaleBand<string>;
	value: ScaleLinear<number, number>;
	groupGap: number;
	stackGap: number;
}): BarRect[] {
	const { data, xKey, keys, hidden, orientation, stacked, band, value } =
		options;
	const visible = keys.filter((k) => !hidden.has(k));
	const bandwidth = band.bandwidth();
	const gap = visible.length > 1 ? options.groupGap : 0;
	const slot = stacked
		? bandwidth
		: (bandwidth - gap * (visible.length - 1)) / Math.max(1, visible.length);
	const base = value(0);
	const rects: BarRect[] = [];
	data.forEach((datum, index) => {
		const start = band(categoryOf(datum, xKey)) ?? 0;
		let up = 0;
		let down = 0;
		const lastVisible = visible.at(-1);
		for (const key of keys) {
			const raw = datum[key];
			if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
			const isHidden = hidden.has(key);
			const slotIndex = Math.max(0, visible.indexOf(key));
			const offset = stacked ? start : start + slotIndex * (slot + gap);
			let from = 0;
			let to = raw;
			if (stacked && !isHidden) {
				from = raw >= 0 ? up : down;
				to = from + raw;
				if (raw >= 0) up = to;
				else down = to;
			}
			const a = isHidden ? base : value(from);
			const b = isHidden ? base : value(to);
			const stackInset =
				stacked && !isHidden && key !== lastVisible ? options.stackGap : 0;
			const low = Math.min(a, b);
			const length = Math.max(0, Math.abs(b - a) - stackInset);
			const rect: Rect =
				orientation === "vertical"
					? {
							x: offset,
							y: raw >= 0 ? low + stackInset : low,
							width: slot,
							height: length,
						}
					: {
							x: raw >= 0 ? low : low + stackInset,
							y: offset,
							width: length,
							height: slot,
						};
			rects.push({
				key: `${key}::${categoryOf(datum, xKey)}`,
				series: key,
				index,
				value: raw,
				hidden: isHidden,
				cap: !stacked || options.stackGap > 0 || key === lastVisible,
				...rect,
			});
		}
	});
	return rects;
}

/** Zero-length version of a rect sitting on the baseline, where bars grow from and shrink to. */
export function collapsed(
	rect: Rect,
	orientation: BarOrientationVariant,
	base: number,
): Rect {
	return orientation === "vertical"
		? { x: rect.x, y: base, width: rect.width, height: 0 }
		: { x: base, y: rect.y, width: 0, height: rect.height };
}

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
	return {
		x: a.x + (b.x - a.x) * t,
		y: a.y + (b.y - a.y) * t,
		width: a.width + (b.width - a.width) * t,
		height: a.height + (b.height - a.height) * t,
	};
}

/** Per-category delay: `i * 0.4 * duration / n`. */
export function staggerDelay(index: number, count: number): number {
	return count > 1 ? (index * STAGGER_SHARE * ENTER_MS) / count : 0;
}

export function enterSpan(count: number, squares: boolean): number {
	const base = squares ? ENTER_MS * (1 + STAGGER_SHARE) : ENTER_MS;
	return base + staggerDelay(count - 1, count);
}

/** Squares a bar length into cells, bottom cell first. */
export function squareColumn(
	length: number,
	size: number,
	gap = SQUARE_GAP,
): number[] {
	if (length <= 0 || size <= 0) return [];
	const step = size + gap;
	const count = Math.max(1, Math.round(length / step));
	return Array.from({ length: count }, (_, i) => i * step);
}

/** Delay of square `j` in a column: cascades over 40% of the enter duration. */
export function squareDelay(j: number, count: number): number {
	return count > 1 ? (j * STAGGER_SHARE * ENTER_MS) / (count - 1) : 0;
}

export interface DepthFaces {
	front: Rect;
	side: string;
	lid: string;
}

type Point = [number, number];

/** Maps points into an upright frame (category along x, bar rising from `base` toward y=0) and back. */
function uprightMap(
	orientation: BarOrientationVariant,
	negative: boolean,
	base: number,
) {
	const vertical = orientation === "vertical";
	const flip = (v: number) =>
		(vertical ? negative : !negative) ? 2 * base - v : v;
	return {
		to: ([x, y]: Point): Point => (vertical ? [x, flip(y)] : [y, flip(x)]),
		from: ([u, v]: Point): Point => (vertical ? [u, flip(v)] : [flip(v), u]),
	};
}

function mapRect(rect: Rect, map: (p: Point) => Point): Rect {
	const [x1, y1] = map([rect.x, rect.y]);
	const [x2, y2] = map([rect.x + rect.width, rect.y + rect.height]);
	return {
		x: Math.min(x1, x2),
		y: Math.min(y1, y2),
		width: Math.abs(x2 - x1),
		height: Math.abs(y2 - y1),
	};
}

const pathOf = (points: Point[], map: (p: Point) => Point) =>
	`M${points.map((p) => map(p).join(",")).join("L")}Z`;

/** Bar depth: side face toward the chart centre, lid lifted by 45% of the depth, any direction. */
export function depthFaces(
	rect: Rect,
	options: {
		orientation: BarOrientationVariant;
		negative: boolean;
		/** Middle of the category axis. */
		center: number;
		step: number;
		bandwidth: number;
		base: number;
	},
): DepthFaces | null {
	const { base, center } = options;
	const map = uprightMap(options.orientation, options.negative, base);
	const r = mapRect(rect, map.to);
	if (r.height <= 0) return null;
	const gap = Math.max(0, options.step - options.bandwidth);
	const maxDepth = Math.min(options.bandwidth * 0.22, Math.max(0, gap - 1), 7);
	const cx = r.x + r.width / 2;
	const offset = center > 0 ? Math.min(1, Math.abs((cx - center) / center)) : 0;
	const depth = offset * Math.min(maxDepth, r.height);
	if (depth < 0.5) return null;
	const rise = depth * 0.45;
	const dx = cx < center ? depth : -depth;
	const top = r.y + rise;
	const edge = dx > 0 ? r.x + r.width : r.x;
	const front = mapRect(
		{ ...r, y: top, height: Math.max(0, r.height - rise) },
		map.from,
	);
	const side = pathOf(
		[
			[edge, top],
			[edge + dx, r.y],
			[edge + dx, base - rise],
			[edge, base],
		],
		map.from,
	);
	const lid = pathOf(
		[
			[r.x, top],
			[r.x + r.width, top],
			[r.x + r.width + dx, r.y],
			[r.x + dx, r.y],
		],
		map.from,
	);
	return { front, side, lid };
}

/** Pulse band at progress `p`, swept from the baseline past the bar's far end. */
export function pulseRect(
	rect: Rect,
	options: {
		orientation: BarOrientationVariant;
		negative: boolean;
		base: number;
	},
	p: number,
): Rect {
	const map = uprightMap(options.orientation, options.negative, options.base);
	const r = mapRect(rect, map.to);
	const band = Math.max(r.height * 0.55, 36);
	const start = r.y + r.height;
	const end = r.y - band;
	return mapRect(
		{ x: r.x, y: start + (end - start) * p, width: r.width, height: band },
		map.from,
	);
}

const fract = (v: number) => v - Math.floor(v);

/** Seeded skeleton heights between 20% and 80%, re-rolled by `tick`; never Math.random. */
export function skeletonHeights(count: number, tick: number): number[] {
	return Array.from(
		{ length: count },
		(_, i) =>
			0.2 + 0.6 * fract(Math.sin(i * 12.9898 + tick * 78.233) * 43758.5453),
	);
}

/** Opacity stops of the sweep band: 0.05 + sin²(πt) * 0.85, in 17 steps. */
export const SWEEP_STOPS = Array.from({ length: 17 }, (_, i) => {
	const t = i / 16;
	return {
		offset: `${Math.round(t * 100)}%`,
		opacity: 0.05 + Math.sin(Math.PI * t) ** 2 * 0.85,
	};
});

/** Index of the band nearest `pos` along the category axis. */
export function nearestBand(
	band: ScaleBand<string>,
	domain: string[],
	pos: number,
): number {
	let best = -1;
	let bestDistance = Number.POSITIVE_INFINITY;
	const half = band.bandwidth() / 2;
	domain.forEach((category, i) => {
		const distance = Math.abs((band(category) ?? 0) + half - pos);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = i;
		}
	});
	return best;
}

export function summarizeBars(options: {
	data: Datum[];
	xKey: string;
	series: { key: string; label: string }[];
	format: Formatters;
}): string {
	const { data, xKey, series, format } = options;
	if (data.length === 0 || series.length === 0) return "No data.";
	const parts = series.map(({ key, label }) => {
		let min: Datum | undefined;
		let max: Datum | undefined;
		for (const datum of data) {
			const value = datum[key];
			if (typeof value !== "number") continue;
			if (!min || value < (min[key] as number)) min = datum;
			if (!max || value > (max[key] as number)) max = datum;
		}
		if (!min || !max) return `${label}: no values.`;
		return `${label} is highest at ${categoryOf(max, xKey)} (${format.number(
			max[key] as number,
		)}) and lowest at ${categoryOf(min, xKey)} (${format.number(min[key] as number)}).`;
	});
	return `${data.length} categories. ${parts.join(" ")}`;
}
