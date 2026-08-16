<script lang="ts">
type Props = { eyebrow?: string; title: string; description?: string };
let { eyebrow, title, description }: Props = $props();
</script>

<header class="mb-10 border-b border-hairline pb-8">
	{#if eyebrow}
		<span
			class="text-[11px] font-semibold uppercase tracking-widest text-muted"
		>
			{eyebrow}
		</span>
	{/if}
	<h1
		class="mt-3 font-display text-4xl text-ink md:text-5xl"
		style="letter-spacing: -0.035em;"
	>
		{title}
	</h1>
	{#if description}
		<p class="mt-4 text-lg leading-[1.55] text-body">{description}</p>
	{/if}
</header>
