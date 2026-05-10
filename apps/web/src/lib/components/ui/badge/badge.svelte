<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
		variants: {
			variant: {
				default: "border-border bg-bg-subtle text-fg-muted",
				accent: "border-accent/30 bg-accent-subtle text-accent",
				outline: "border-border-strong bg-transparent text-fg",
				success: "border-success/30 bg-success/10 text-success",
				soon: "border-border bg-bg-muted text-fg-subtle font-mono uppercase tracking-[0.05em] text-[10px]",
			},
		},
		defaultVariants: { variant: "default" },
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn } from "$lib/utils";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLSpanElement>, "class">;

	let { variant = "default", class: className, children, ...rest }: Props = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)} {...rest}>
	{@render children?.()}
</span>
