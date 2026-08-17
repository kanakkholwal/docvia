<script lang="ts">
import { ChevronDown } from "@lucide/svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";
import { cn } from "$lib/utils";

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
		"border-b border-hairline last:border-b-0",
		className,
	)}
>
	<button
		type="button"
		aria-expanded={isOpen}
		onclick={() => (isOpen = !isOpen)}
		class="flex w-full items-center justify-between gap-4 py-5 text-left text-ink transition-colors duration-(--motion-fast) ease-out hover:text-brand-ink"
	>
		<span class="text-[16px] font-medium leading-[1.35] md:text-[17px]">
			{question}
		</span>
		<ChevronDown
			class={cn(
				"h-5 w-5 shrink-0 text-muted transition-transform duration-(--motion-base) ease-out",
				isOpen && "rotate-180 text-brand-ink",
			)}
		/>
	</button>
	{#if isOpen}
		<div
			transition:slide={{ duration: 200, easing: cubicOut }}
			class="pb-5 pr-8 text-[15px] leading-[1.7] text-body"
		>
			{@render children?.()}
		</div>
	{/if}
</div>
