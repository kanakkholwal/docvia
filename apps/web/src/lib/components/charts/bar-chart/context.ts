import type { ScaleBand, ScaleLinear } from "d3-scale";
import { getContext, setContext } from "svelte";
import type {
	ChartPhase,
	Datum,
	Margin,
	SeriesConfig,
} from "#lib/components/charts/chart/core.js";
import type { BarRect, Rect } from "./bar-core";
import type {
	BarEntrance,
	BarOrientationVariant,
	BarVariant,
} from "./variants";

export interface DisplayedBar {
	target: BarRect;
	rect: Rect;
	/** Entrance progress 0 to 1; drives opacity and blur for the fade entrance. */
	progress: number;
	/** Milliseconds into this bar's own entrance, or null outside enter and exit. */
	elapsed: number | null;
}

export interface BarContextValue {
	readonly data: Datum[];
	readonly xKey: string;
	readonly orientation: BarOrientationVariant;
	readonly variant: BarVariant;
	readonly entrance: BarEntrance;
	readonly stacked: boolean;
	readonly band: ScaleBand<string>;
	readonly value: ScaleLinear<number, number>;
	readonly categories: string[];
	readonly displayed: Map<string, DisplayedBar>;
	readonly series: SeriesConfig[];
	register: (series: SeriesConfig) => () => void;
	readonly phase: ChartPhase;
	readonly activeIndex: number | null;
	readonly innerWidth: number;
	readonly innerHeight: number;
	readonly margin: Margin;
	readonly plotEl: HTMLDivElement | null;
	readonly width: number;
	readonly height: number;
	readonly uid: string;
}

const BAR = Symbol("bar-chart");

export function setBarChart(value: BarContextValue) {
	setContext(BAR, value);
}

export function useBarChart(): BarContextValue {
	const context = getContext<BarContextValue | undefined>(BAR);
	if (!context)
		throw new Error("Bar parts must be rendered inside a <BarChart />");
	return context;
}
