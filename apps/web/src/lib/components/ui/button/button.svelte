<script lang="ts" module>
import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
	base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	variants: {
		variant: {
			// vite.dev's "Get Started" is white-on-canvas, not the violet. Violet
			// stays an accent (prompts, active states, links).
			primary: "bg-action text-on-action hover:bg-action-hover",
			secondary: "bg-surface-soft text-ink hover:bg-surface-card",
			ghost: "text-body hover:bg-surface-soft hover:text-ink",
			outline:
				"border border-hairline bg-transparent text-ink hover:border-hairline-strong hover:bg-surface-soft",
			brand: "bg-brand text-on-brand hover:bg-brand-hover",
			link: "text-brand-ink underline-offset-4 hover:underline",
		},
		size: {
			// 38px / 8px radius / 8-16px padding / 16px-500 label — measured.
			sm: "h-8 px-3 text-[14px]",
			default: "h-9.5 px-4 text-[16px]",
			lg: "h-11 px-5 text-[16px]",
			icon: "h-9.5 w-9.5",
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
