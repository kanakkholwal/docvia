<script lang="ts">
import { cn } from "$lib/utils";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

type Props = {
	class?: string;
	children?: Snippet;
} & Omit<HTMLAttributes<HTMLDivElement>, "class">;

let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn(
		"rounded-lg border border-border bg-bg-subtle p-6 transition-colors duration-[var(--motion-base)]",
		className,
	)}
	{...rest}
>
	{@render children?.()}
</div>
