<script lang="ts">
type Props = { eyebrow?: string; title: string; description?: string };
let { eyebrow, title, description }: Props = $props();
</script>

<header class="mb-10 border-b border-border pb-8">
	{#if eyebrow}
		<span
			class="text-xs font-medium uppercase tracking-[0.05em] text-accent"
		>
			{eyebrow}
		</span>
	{/if}
	<h1
		class="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
	>
		{title}
	</h1>
	{#if description}
		<p class="mt-3 text-lg leading-relaxed text-fg-muted">{description}</p>
	{/if}
</header>
