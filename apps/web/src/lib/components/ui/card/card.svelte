<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "$lib/utils";

type Props = {
	class?: string;
	children?: Snippet;
} & Omit<HTMLAttributes<HTMLDivElement>, "class">;

let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn(
		"rounded-md border border-hairline bg-surface-soft p-6 transition-colors duration-(--motion-base) ease-out",
		className,
	)}
	{...rest}
>
	{@render children?.()}
</div>
