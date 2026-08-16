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
	<div class="mx-auto max-w-page px-5 pt-14 pb-14 text-center sm:px-10 sm:pt-28">
		<span class="label-meta">By the numbers</span>
		<h2
			class="mx-auto mt-4 max-w-2xl font-display text-[28px] leading-[1.2] tracking-[-0.025em] text-ink sm:text-[40px] sm:leading-[1.3333]"
		>
			Nothing to meter, nothing to trust us with.
		</h2>
	</div>

	<div
		class="mx-auto grid max-w-page grid-cols-2 divide-x divide-y divide-hairline border-t border-hairline md:grid-cols-4 md:divide-y-0"
	>
		{#each stats as stat}
			<div class="flex flex-col items-start gap-2 px-5 py-10 sm:px-10">
				<span
					class="font-display text-[40px] leading-[1.3333] tracking-[-0.025em] text-brand-ink"
				>
					{stat.value}
				</span>
				<span class="text-[14px] leading-normal text-muted">{stat.label}</span>
			</div>
		{/each}
	</div>
</section>
