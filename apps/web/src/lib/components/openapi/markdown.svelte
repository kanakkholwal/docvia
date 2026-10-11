<script lang="ts">
import Prose from "#lib/components/docs/prose.svelte";
import { cn } from "#lib/cn.js";

// Spec descriptions arrive as HTML rendered at build time, with any raw HTML escaped.
let { html, class: className }: { html: string | undefined; class?: string } = $props();
</script>

{#if html}
	<Prose class={cn("[&_p]:my-0 [&_p+p]:mt-2 [&_ul]:my-2 [&_ol]:my-2", className)}>
		{@html html}
	</Prose>
{/if}
