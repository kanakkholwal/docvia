import type { ScaleLinear, ScaleTime } from "d3-scale";
import { getContext, setContext } from "svelte";
import type {
	ActivePoint,
	ChartConfigShape,
	ChartPhase,
	ChartSelection,
	Datum,
	Formatters,
	Margin,
	SeriesConfig,
	TooltipRow,
} from "./core";

export type ChartConfig = ChartConfigShape;

export type TickScale = ((value: unknown) => number) & {
	ticks: (count?: number) => unknown[];
};

export interface ChartContextValue {
	readonly id: string;
	readonly config: ChartConfig;
	readonly format: Formatters;
	readonly title: string;
	readonly description: string | undefined;
	readonly hidden: ReadonlySet<string>;
	toggleSeries: (key: string) => void;
	highlighted: string | null;
}

/** Plot geometry every cartesian part reads: grid, reference area, background. */
export interface CartesianContextValue {
	readonly width: number;
	readonly height: number;
	readonly innerWidth: number;
	readonly innerHeight: number;
	readonly margin: Margin;
	/** Scale behind horizontal grid lines; absent when rows make no sense (horizontal bars). */
	readonly rowScale?: TickScale;
	readonly columnScale?: TickScale;
	readonly phase: ChartPhase;
	readonly animate: boolean;
	readonly clipId: string;
	readonly plotEl: HTMLDivElement | null;
}

export interface PlotContextValue extends CartesianContextValue {
	readonly data: Datum[];
	readonly xKey: string;
	readonly xScale: ScaleTime<number, number>;
	readonly yScale: ScaleLinear<number, number>;
	readonly x: (datum: Datum) => number;
	readonly labels: string[];
	readonly series: SeriesConfig[];
	register: (series: SeriesConfig) => () => void;
	/** Only time-series roots support selection; other roots leave these unset. */
	readonly selection?: ChartSelection | null;
	/** Plot-space x of the selection edges, when one exists. */
	readonly selectionX?: [number, number] | null;
}

export interface ActiveContextValue {
	readonly active: ActivePoint | null;
	/** True when the last move came from the keyboard, so followers jump instead of springing. */
	readonly instant: boolean;
	readonly title: (datum: Datum) => string;
	readonly rows: (datum: Datum) => TooltipRow[];
}

const CHART = Symbol("chart");
const CARTESIAN = Symbol("chart-cartesian");
const PLOT = Symbol("chart-plot");
const ACTIVE = Symbol("chart-active");

export function setChart(value: ChartContextValue) {
	setContext(CHART, value);
}

export function useChart(): ChartContextValue {
	const context = getContext<ChartContextValue | undefined>(CHART);
	if (!context)
		throw new Error("useChart must be used within a <ChartContainer />");
	return context;
}

export function setCartesian(value: CartesianContextValue) {
	setContext(CARTESIAN, value);
}

export function useCartesian(): CartesianContextValue {
	const context = getContext<CartesianContextValue | undefined>(CARTESIAN);
	if (!context)
		throw new Error(
			"Cartesian chart parts must be rendered inside a cartesian chart",
		);
	return context;
}

export function setPlot(value: PlotContextValue) {
	setContext(PLOT, value);
	setContext(CARTESIAN, value);
}

export function usePlot(): PlotContextValue {
	const context = getContext<PlotContextValue | undefined>(PLOT);
	if (!context)
		throw new Error(
			"Chart parts must be rendered inside a chart such as <LineChart />",
		);
	return context;
}

export function setActivePoint(value: ActiveContextValue) {
	setContext(ACTIVE, value);
}

export function useActivePoint(): ActiveContextValue {
	return (
		getContext<ActiveContextValue | undefined>(ACTIVE) ?? {
			active: null,
			instant: false,
			title: () => "",
			rows: () => [],
		}
	);
}

/** Moves the node to `target`, so HTML overlays declared inside the SVG render in the plot. */
export function portal(target: HTMLElement) {
	return (node: HTMLElement) => {
		target.appendChild(node);
		return () => node.remove();
	};
}
