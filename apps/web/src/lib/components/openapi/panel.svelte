<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "#lib/cn.js";

// The rim of baby-ui's framed Table and CodeBlock: a card-tinted frame, content on an inset surface.
let {
	header,
	children,
	class: className,
	bodyClass,
}: { header?: Snippet; children?: Snippet; class?: string; bodyClass?: string } = $props();
</script>

<div class={cn("min-w-0 rounded-xl border border-border bg-card p-1", className)}>
	{#if header}
		<div class="flex min-h-8 flex-wrap items-center gap-2 px-2 pb-1 text-muted text-xs">
			{@render header()}
		</div>
	{/if}
	<div class={cn("rounded-[calc(var(--radius-xl)-1px-0.25rem)] bg-background", bodyClass)}>
		{@render children?.()}
	</div>
</div>
