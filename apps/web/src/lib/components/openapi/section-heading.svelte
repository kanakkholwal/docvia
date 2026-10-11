<script lang="ts">
import type { Snippet } from "svelte";

let { id, children }: { id: string; children: Snippet } = $props();
</script>

<h2 {id} class="mt-12 mb-4 scroll-mt-24 font-display text-2xl text-ink tracking-tight">
	{@render children()}
</h2>
