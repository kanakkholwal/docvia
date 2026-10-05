import { tv, type VariantProps } from "tailwind-variants";

export const barChart = tv({
	slots: {
		bar: "transition-opacity duration-(--duration-fast) ease-[cubic-bezier(0.42,0,0.58,1)]",
		band: "pointer-events-none fill-foreground/[0.05]",
		category:
			"fill-muted-foreground text-xs transition-[opacity,fill] duration-(--duration-fast)",
		tick: "fill-muted-foreground text-xs tabular-nums",
		side: "pointer-events-none",
		lid: "pointer-events-none",
		glass: "pointer-events-none",
		skeleton: "fill-foreground",
	},
	variants: {
		orientation: {
			vertical: { category: "[text-anchor:middle]", tick: "[text-anchor:end]" },
			horizontal: {
				category: "[text-anchor:end]",
				tick: "[text-anchor:middle]",
			},
		},
		variant: {
			bar: {},
			squares: { bar: "[shape-rendering:geometricPrecision]" },
			depth: {
				side: "[filter:brightness(0.62)]",
				lid: "[filter:brightness(1.3)]",
			},
		},
		lineCap: {
			round: { bar: "[stroke-linejoin:round]" },
			butt: { bar: "[stroke-linejoin:miter]" },
		},
		entrance: {
			grow: {},
			fade: { bar: "[will-change:opacity,filter]" },
		},
	},
	defaultVariants: {
		orientation: "vertical",
		variant: "bar",
		lineCap: "round",
		entrance: "grow",
	},
});

export type BarOrientationVariant = NonNullable<
	VariantProps<typeof barChart>["orientation"]
>;
export type BarVariant = NonNullable<VariantProps<typeof barChart>["variant"]>;
export type BarLineCap = NonNullable<VariantProps<typeof barChart>["lineCap"]>;
export type BarEntrance = NonNullable<
	VariantProps<typeof barChart>["entrance"]
>;
