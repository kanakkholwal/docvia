<script lang="ts">
	import { cn } from "$lib/utils";
	import { ChevronDown } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	type Props = {
		question: string;
		open?: boolean;
		class?: string;
		children?: import("svelte").Snippet;
	};

	let { question, open = false, class: className, children }: Props = $props();
	let isOpen = $state(open);
</script>

<div
	class={cn(
		"border-b border-border/60 last:border-b-0",
		className,
	)}
>
	<button
		type="button"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
		class="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors duration-[var(--motion-fast)] hover:text-accent"
	>
		<span class="font-display text-base font-medium tracking-tight md:text-lg">
			{question}
		</span>
		<ChevronDown
			class={cn(
				"h-5 w-5 shrink-0 text-fg-muted transition-transform duration-[var(--motion-base)]",
				isOpen && "rotate-180 text-accent",
			)}
		/>
	</button>
	{#if isOpen}
		<div
			transition:slide={{ duration: 200 }}
			class="pb-5 pr-8 text-sm leading-relaxed text-fg-muted"
		>
			{@render children?.()}
		</div>
	{/if}
</div>
