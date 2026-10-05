import { tv, type VariantProps } from "tailwind-variants";

export const themeToggle = tv({
	base: "flex items-center justify-center",
	variants: {
		variant: {
			rectangle: "",
			circle: "",
			"circle-blur": "",
			blinds: "",
		},
		start: {
			"top-left": "",
			"top-right": "",
			"bottom-left": "",
			"bottom-right": "",
			center: "",
			"bottom-up": "",
		},
	},
	defaultVariants: { variant: "rectangle", start: "bottom-up" },
});

export type ThemeToggleVariant = NonNullable<
	VariantProps<typeof themeToggle>["variant"]
>;
export type ThemeToggleStart = NonNullable<
	VariantProps<typeof themeToggle>["start"]
>;
export type ThemeToggleValue = "light" | "dark";
