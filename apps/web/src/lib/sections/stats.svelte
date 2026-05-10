<script lang="ts">
const stats = [
	{ value: "<10ms", label: "Warm rebuild for unchanged content" },
	{ value: "0kb", label: "Markdown parser shipped to the browser" },
	{ value: "5", label: "Plugin hooks across the pipeline" },
	{ value: "100%", label: "TypeScript, end to end" },
];
</script>

<section class="border-y border-border/60 bg-bg-subtle/40">
	<div class="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-16">
		<div
			class="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4"
		>
			{#each stats as stat}
				<div class="flex flex-col items-start gap-1.5 text-left">
					<span
						class="font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl"
					>
						{stat.value}
					</span>
					<span class="text-xs leading-snug text-fg-muted md:text-sm">
						{stat.label}
					</span>
				</div>
			{/each}
		</div>
	</div>
</section>
