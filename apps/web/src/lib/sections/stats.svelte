<script lang="ts">
// Authentic, architectural facts only — no performance claims until a real
// benchmark pipeline backs them up.
const stats = [
	{ value: "0kb", label: "Markdown parser shipped to the browser" },
	{ value: "5+", label: "Framework render targets, and growing" },
	{ value: "100%", label: "Typed end to end, in TypeScript" },
	{ value: "MIT", label: "Open source, self-host anywhere" },
];
</script>

<section class="border-b border-hairline bg-canvas">
	<div
		class="grid grid-cols-2 divide-x divide-y divide-hairline md:grid-cols-4 md:divide-y-0"
	>
		{#each stats as stat}
			<div class="flex flex-col items-start gap-2 px-6 py-10 md:px-10">
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
</section>
