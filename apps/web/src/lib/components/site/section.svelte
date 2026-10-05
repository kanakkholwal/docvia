<script lang="ts">
import { cn } from "#lib/cn.ts";
import type { Snippet } from "svelte";

type Props = {
	id?: string;
	number: number;
	title: string;
	description?: string;
	action?: Snippet;
	class?: string;
	children: Snippet;
};

let { id, number, title, description, action, class: className, children }: Props = $props();
</script>

<section
	{id}
	aria-labelledby={id ? `${id}-title` : undefined}
	class={cn("rise scroll-mt-24 border-t border-dashed border-hairline-strong pt-10", className)}
>
	<div class="mb-8 flex min-h-8 items-end justify-between gap-4">
		<div class="flex min-w-0 flex-col gap-3">
			<div class="flex items-baseline gap-3">
				<span class="font-mono text-xs text-brand-ink tabular-nums">{String(number).padStart(2, "0")}</span>
				<h2 id={id ? `${id}-title` : undefined} class="font-pixel text-2xl text-ink sm:text-3xl">{title}</h2>
			</div>
			{#if description}
				<p class="max-w-xl text-sm text-muted sm:text-base">{description}</p>
			{/if}
		</div>
		{#if action}<div class="shrink-0">{@render action()}</div>{/if}
	</div>
	{@render children()}
</section>
