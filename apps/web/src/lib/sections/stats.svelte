<script lang="ts">
const stats = [
	{ value: "<10ms", label: "Warm rebuild for unchanged content" },
	{ value: "0kb", label: "Markdown parser shipped to the browser" },
	{ value: "5+", label: "Framework adapters and growing" },
	{ value: "100%", label: "TypeScript, end to end" },
];
</script>

<section class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 pb-12 md:px-10 md:pb-16">
		<div
			class="grid grid-cols-2 gap-8 rounded-xl bg-surface-card px-8 py-10 md:grid-cols-4 md:px-12"
		>
			{#each stats as stat}
				<div class="flex flex-col items-start gap-2 text-left">
					<span
						class="font-display text-[40px] leading-[1.05] text-ink md:text-[44px]"
						style="letter-spacing: -0.035em;"
					>
						{stat.value}
					</span>
					<span class="text-[13px] leading-[1.45] text-muted md:text-[14px]">
						{stat.label}
					</span>
				</div>
			{/each}
		</div>
	</div>
</section>
