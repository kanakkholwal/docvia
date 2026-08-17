<script lang="ts" module>
import { tv, type VariantProps } from "tailwind-variants";

export const badgeVariants = tv({
	base: "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium leading-[1.2] tracking-[0.01em]",
	variants: {
		variant: {
			default: "border-hairline bg-surface-soft text-body",
			accent: "border-brand/30 bg-brand-soft text-brand-ink",
			outline: "border-control-border bg-transparent text-ink",
			success: "border-success/30 bg-success/10 text-success",
			soon: "border-hairline bg-surface-card text-muted font-mono uppercase tracking-[0.04em] text-[10px]",
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
