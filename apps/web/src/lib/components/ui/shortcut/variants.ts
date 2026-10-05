import { tv, type VariantProps } from "tailwind-variants";

export const shortcutCap = tv({
	base: [
		"inline-flex items-center justify-center rounded font-medium font-sans",
		// Inside a primary button the cap reads in the button's own foreground. Scoped to the
		// button slot: Dialog and others carry data-variant=default too.
		"[[data-slot=button][data-variant=default]_&]:border-transparent [[data-slot=button][data-variant=default]_&]:bg-primary-foreground/15 [[data-slot=button][data-variant=default]_&]:text-primary-foreground",
	],
	variants: {
		variant: {
			default: "border border-border bg-card text-muted-foreground",
			ghost: "text-muted-foreground",
			solid: "bg-foreground/[0.08] text-foreground",
			outline: "border border-border-strong text-foreground",
		},
		size: {
			sm: "h-4 min-w-4 px-1 text-xs",
			md: "h-5 min-w-5 px-1.5 text-xs",
			lg: "h-6 min-w-6 px-2 text-xs",
			xl: "h-7 min-w-7 px-2.5 text-sm",
		},
	},
	defaultVariants: { variant: "default", size: "md" },
});

export type ShortcutVariant = NonNullable<
	VariantProps<typeof shortcutCap>["variant"]
>;
export type ShortcutSize = NonNullable<
	VariantProps<typeof shortcutCap>["size"]
>;
