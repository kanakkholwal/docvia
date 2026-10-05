import { tv, type VariantProps } from "tailwind-variants";

export const rollText = tv({
	base: "roll-text relative inline-block cursor-default",
	variants: {
		size: {
			sm: "text-sm",
			md: "text-base",
			lg: "text-lg",
		},
		/** Slide rolls a second copy up; tilt tips each letter back while its copy flips up in 3D. */
		motion: {
			slide: "",
			tilt: "roll-text--tilt",
		},
	},
	defaultVariants: { size: "md", motion: "slide" },
});

export type RollTextSize = NonNullable<VariantProps<typeof rollText>["size"]>;
export type RollTextMotion = NonNullable<
	VariantProps<typeof rollText>["motion"]
>;

/** Animations that mark a unit finished: the stack roll, or the tilt echo landing. */
export const ROLL_DONE = new Set(["roll-stack-open", "roll-tilt-in"]);

const STAGGERS = ["none", "word", "character"] as const;
/** Not a styling variant: how the label is split for the roll animation. */
export type RollStagger = (typeof STAGGERS)[number];
