import { tv, type VariantProps } from "tailwind-variants";

export const chart = tv({
	slots: {
		root: "flex w-full min-w-0 flex-col gap-3 text-xs",
		plot: "relative min-h-0 w-full flex-1 touch-pan-y rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
		srOnly: "sr-only",
	},
	variants: {
		aspect: {
			video: { root: "aspect-video" },
			wide: { root: "aspect-[2/1]" },
			square: { root: "aspect-square" },
			auto: { root: "h-full" },
		},
	},
	defaultVariants: { aspect: "video" },
});

export type ChartAspect = NonNullable<VariantProps<typeof chart>["aspect"]>;

export const chartGrid = tv({
	base: "fill-none stroke-border",
	variants: {
		variant: {
			dashed: "[stroke-dasharray:4_4]",
			dotted: "[stroke-dasharray:1_4] [stroke-linecap:round]",
			solid: "",
		},
	},
	defaultVariants: { variant: "dashed" },
});

export type ChartGridVariant = NonNullable<
	VariantProps<typeof chartGrid>["variant"]
>;

export const chartAxis = tv({
	slots: {
		tick: "fill-muted-foreground text-xs tabular-nums",
		line: "stroke-border-strong",
	},
	variants: {
		tickLine: {
			true: {},
			false: { line: "hidden" },
		},
	},
	defaultVariants: { tickLine: false },
});

export const chartTooltip = tv({
	slots: {
		panel:
			"pointer-events-none min-w-32 overflow-hidden rounded-lg border border-border bg-popover/95 px-3 py-2.5 text-popover-foreground shadow-lg backdrop-blur-md",
		title: "mb-2 font-medium text-foreground text-xs",
		rows: "grid gap-1.5",
		row: "flex w-full items-center gap-2 text-xs",
		indicator: "shrink-0 rounded-[2px] border-(--indicator) bg-(--indicator)",
		label: "flex-1 text-muted-foreground",
		value: "font-medium font-mono text-foreground tabular-nums",
		pill: "pointer-events-none flex h-6 items-center overflow-hidden rounded-full bg-foreground px-3 font-medium text-background text-xs shadow-lg",
	},
	variants: {
		indicator: {
			dot: { indicator: "size-2.5" },
			line: { indicator: "h-3.5 w-1", row: "items-stretch" },
			dashed: {
				indicator: "h-3.5 w-0 border-[1.5px] border-dashed bg-transparent",
			},
		},
	},
	defaultVariants: { indicator: "dot" },
});

export type ChartTooltipIndicator = NonNullable<
	VariantProps<typeof chartTooltip>["indicator"]
>;

export const chartLegend = tv({
	slots: {
		root: "flex flex-wrap items-center gap-1.5",
		swatch:
			"size-2.5 shrink-0 rounded-[3px] border-2 border-(--swatch) bg-(--swatch) transition-colors",
		item: "transition-opacity duration-(--duration-fast)",
		label:
			"inline-flex h-7 items-center gap-1.5 px-2 font-medium text-muted-foreground text-xs",
	},
	variants: {
		align: {
			start: { root: "justify-start" },
			center: { root: "justify-center" },
			end: { root: "justify-end" },
		},
		hidden: {
			true: { swatch: "bg-transparent", item: "opacity-60" },
			false: {},
		},
	},
	defaultVariants: { align: "center", hidden: false },
});

export type ChartLegendAlign = NonNullable<
	VariantProps<typeof chartLegend>["align"]
>;

export const chartReferenceArea = tv({
	slots: {
		area: "transition-opacity duration-[420ms] ease-[cubic-bezier(0,0,0.58,1)]",
		edge: "fill-none [stroke-dasharray:4_4]",
		label: "font-medium text-xs",
	},
	variants: {
		tone: {
			muted: {
				area: "fill-foreground/[0.04]",
				edge: "stroke-border-strong",
				label: "fill-muted-foreground",
			},
			highlight: {
				area: "fill-chart-4/10",
				edge: "stroke-chart-4/60",
				label: "fill-chart-4",
			},
			positive: {
				area: "fill-chart-positive/10",
				edge: "stroke-chart-positive/60",
				label: "fill-chart-positive",
			},
			negative: {
				area: "fill-chart-negative/10",
				edge: "stroke-chart-negative/60",
				label: "fill-chart-negative",
			},
		},
	},
	defaultVariants: { tone: "muted" },
});

export type ChartReferenceTone = NonNullable<
	VariantProps<typeof chartReferenceArea>["tone"]
>;

export const chartBackground = tv({
	base: "text-foreground/[0.07] transition-opacity duration-[420ms] ease-[cubic-bezier(0,0,0.58,1)]",
	variants: {
		variant: {
			dots: "",
			lines: "",
			grid: "",
			gradient: "text-chart-1/[0.12]",
		},
	},
	defaultVariants: { variant: "dots" },
});

export type ChartBackgroundVariant = NonNullable<
	VariantProps<typeof chartBackground>["variant"]
>;

export const chartSelection = tv({
	slots: {
		root: "pointer-events-none transition-opacity duration-(--duration-fast) ease-[cubic-bezier(0,0,0.58,1)]",
		area: "fill-foreground/[0.06]",
		edge: "fill-none stroke-muted-foreground",
	},
	variants: {
		edge: {
			dashed: { edge: "[stroke-dasharray:4_4]" },
			solid: { edge: "" },
			none: { edge: "hidden" },
		},
	},
	defaultVariants: { edge: "dashed" },
});

export type ChartSelectionEdge = NonNullable<
	VariantProps<typeof chartSelection>["edge"]
>;
