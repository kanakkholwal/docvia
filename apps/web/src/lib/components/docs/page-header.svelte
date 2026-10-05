<script lang="ts">
type Props = { eyebrow?: string; title: string; description?: string };
let { eyebrow, title, description }: Props = $props();
</script>

<header class="mb-10 border-b border-dashed border-hairline-strong pb-8">
	{#if eyebrow}
		<span class="font-mono text-xs text-brand-ink">{eyebrow.toLowerCase()}</span>
	{/if}
	<h1 class="mt-3 font-display text-4xl tracking-tighter text-ink md:text-5xl">
		{title}
	</h1>
	{#if description}
		<p class="mt-4 text-lg text-pretty text-body">{description}</p>
	{/if}
</header>
