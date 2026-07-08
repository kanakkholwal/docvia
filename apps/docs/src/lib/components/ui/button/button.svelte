<script lang="ts" module>
import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
	base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-[var(--motion-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	variants: {
		variant: {
			primary:
				"bg-accent text-accent-fg hover:bg-accent/90 active:bg-accent/95 shadow-sm",
			secondary:
				"bg-bg-muted text-fg hover:bg-bg-muted/80 border border-border",
			ghost: "text-fg hover:bg-bg-muted",
			outline: "border border-border-strong bg-bg text-fg hover:bg-bg-muted",
			link: "text-accent underline-offset-4 hover:underline",
		},
		size: {
			sm: "h-8 px-3 text-sm",
			default: "h-9 px-4 text-sm",
			lg: "h-11 px-6 text-base",
			icon: "h-9 w-9",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "default",
	},
});

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export type ButtonSize = VariantProps<typeof buttonVariants>["size"];
</script>

<script lang="ts">
	import { cn } from "$lib/utils";
	import type { Snippet } from "svelte";
	import type {
		HTMLAnchorAttributes,
		HTMLButtonAttributes,
	} from "svelte/elements";

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children?: Snippet;
		href?: string;
	} & Omit<HTMLButtonAttributes, "class"> &
		Omit<HTMLAnchorAttributes, "class">;

	let {
		variant = "primary",
		size = "default",
		class: className,
		href,
		children,
		...rest
	}: Props = $props();
</script>

{#if href}
	<a {href} class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{@render children?.()}
	</button>
{/if}
