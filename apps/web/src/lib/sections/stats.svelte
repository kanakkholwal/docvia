<script lang="ts">
// Architectural facts only — no performance claims until a real benchmark
// pipeline backs them up.
const stats = [
	{ value: "0kb", label: "Markdown parser shipped to the browser" },
	{ value: "5+", label: "Framework render targets, and growing" },
	{ value: "100%", label: "Typed end to end, in TypeScript" },
	{ value: "MIT", label: "Open source, self-host anywhere" },
];
</script>

<section class="border-b border-hairline bg-canvas">
	<div class="mx-auto max-w-7xl px-6 pt-20 pb-10 text-center md:px-10 md:pt-28">
		<span class="label-meta">By the numbers</span>
		<h2
			class="mx-auto mt-4 max-w-2xl font-display text-[32px] text-ink md:text-[40px]"
			style="line-height: 1.2; letter-spacing: -0.035em;"
		>
			Nothing to meter, nothing to trust us with.
		</h2>
	</div>

	<div
		class="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-hairline border-t border-hairline md:grid-cols-4 md:divide-y-0"
	>
		{#each stats as stat}
			<div class="flex flex-col items-start gap-2 px-6 py-10 md:px-10">
				<span
					class="font-display text-[40px] leading-[1.1] text-brand-ink"
					style="letter-spacing: -0.035em;"
				>
					{stat.value}
				</span>
				<span class="text-[14px] leading-normal text-muted">{stat.label}</span>
			</div>
		{/each}
	</div>
</section>
