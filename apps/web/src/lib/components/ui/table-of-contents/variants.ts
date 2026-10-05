import { tv, type VariantProps } from "tailwind-variants";

export const tableOfContents = tv({
	slots: {
		root: "relative flex flex-col",
		accent: "pointer-events-none absolute top-0 left-0",
		accentRail:
			"absolute transition-[clip-path] duration-(--duration-base) ease-[var(--ease-out)] motion-reduce:transition-none",
		dot: "absolute top-0 left-0 size-1 rounded-full bg-primary [offset-distance:var(--offset-distance,0)] transition-[offset-distance] duration-(--duration-base) ease-[var(--ease-out)] motion-reduce:transition-none",
		link: "relative scroll-m-4 py-1.5 text-muted-foreground text-sm transition-colors duration-(--duration-fast) [overflow-wrap:anywhere] hover:text-foreground aria-[current=location]:text-primary",
		rail: "absolute -top-1.5 left-0 -z-10 h-[calc(100%+0.375rem)]",
		railLine: "stroke-foreground/10",
	},
	variants: {
		variant: {
			curve: {},
			straight: {},
		},
		indicator: {
			true: {},
			false: { dot: "hidden" },
		},
	},
	defaultVariants: { variant: "curve", indicator: true },
});

export type TableOfContentsVariant = NonNullable<
	VariantProps<typeof tableOfContents>["variant"]
>;
