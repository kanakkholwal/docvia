<script lang="ts">
import { cn } from "#lib/cn.js";

let { path, class: className }: { path: string; class?: string } = $props();

const parts = $derived(path.split(/(\{[^}]+\})/).filter(Boolean));
</script>

<span class={cn("min-w-0 break-all font-medium text-ink", className)}>
	{#each parts as part, i (i)}
		{#if part.startsWith("{")}<span class="text-primary">{part}</span>{:else}{part}{/if}
	{/each}
</span>
