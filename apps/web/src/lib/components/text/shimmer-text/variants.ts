import { tv, type VariantProps } from "tailwind-variants";

export const shimmerText = tv({
	base: "shimmer-text relative inline-block",
	variants: {
		size: {
			inherit: "",
			sm: "text-sm",
			md: "text-base",
			lg: "text-xl",
		},
	},
	defaultVariants: { size: "inherit" },
});

export type ShimmerTextSize = NonNullable<
	VariantProps<typeof shimmerText>["size"]
>;
