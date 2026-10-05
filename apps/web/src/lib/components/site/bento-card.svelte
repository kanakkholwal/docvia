<script lang="ts">
import { cn } from "#lib/cn.ts";
import type { Snippet } from "svelte";

type Props = {
	title?: string;
	description?: string;
	class?: string;
	bodyClass?: string;
	icon?: Snippet;
	children?: Snippet;
};

let { title, description, class: className, bodyClass, icon, children }: Props = $props();
</script>

<!-- The portfolio's Well: content on a raised body, caption in the rim below. -->
<article
	class={cn("flex min-w-0 flex-col rounded-2xl bg-well-rim p-1", className)}
>
	{#if children}
		<div
			class={cn(
				"flex min-w-0 flex-1 flex-col rounded-xl bg-well-body p-5 shadow-surface ring-1 ring-ink/[0.04]",
				bodyClass,
			)}
		>
			{@render children()}
		</div>
	{/if}
	{#if title || description || icon}
		<div class="flex gap-3 px-4 pt-3.5 pb-3">
			{#if icon}<div class="mt-0.5 text-ink [&_svg]:size-4">{@render icon()}</div>{/if}
			<div class="min-w-0">
				{#if title}<h3 class="text-sm font-medium text-ink">{title}</h3>{/if}
				{#if description}<p class="mt-0.5 text-sm text-pretty text-muted">{description}</p>{/if}
			</div>
		</div>
	{/if}
</article>
