import { tv, type VariantProps } from "tailwind-variants";

/** `slide` moves items through a clipped window, `fade` blurs them in place, `roll` turns a stack. */
export const textLoop = tv({
	slots: {
		root: "relative inline-grid align-baseline leading-none",
		sizer: "invisible col-start-1 row-start-1 whitespace-nowrap",
		viewport: "relative col-start-1 row-start-1 grid overflow-hidden",
		item: "col-start-1 row-start-1 block whitespace-nowrap",
		stack: [
			"block translate-y-[calc(var(--text-loop-step,0)*-1.2em)] transition-[translate] duration-(--text-loop-duration) ease-(--ease-out)",
			"data-snap:transition-none motion-reduce:transition-none",
		],
		stackItem: "block h-[1.2em] whitespace-nowrap leading-[1.2em]",
		srOnly: "sr-only",
	},
	variants: {
		variant: {
			slide: {},
			// The blur and drift spill past the box, so the window stays open.
			fade: { viewport: "overflow-visible" },
			roll: { root: "leading-[1.2em]", viewport: "h-[1.2em]" },
		},
		direction: {
			up: { root: "[--text-loop-dir:1]" },
			down: { root: "[--text-loop-dir:-1]" },
		},
		size: {
			inherit: {},
			sm: { root: "text-lg" },
			md: { root: "text-xl" },
			lg: { root: "text-3xl" },
		},
	},
	defaultVariants: { variant: "slide", direction: "up", size: "inherit" },
});

export type TextLoopVariant = NonNullable<
	VariantProps<typeof textLoop>["variant"]
>;
export type TextLoopDirection = NonNullable<
	VariantProps<typeof textLoop>["direction"]
>;
export type TextLoopSize = NonNullable<VariantProps<typeof textLoop>["size"]>;

/** Roll offset for a move from `from` to `to`; wrapping to 0 rolls onto the duplicate first item. */
export function textLoopRollStep(
	from: number,
	to: number,
	count: number,
): number {
	return count > 1 && to === 0 && from === count - 1 ? count : to;
}
