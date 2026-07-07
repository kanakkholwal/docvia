<script lang="ts">
// Honest analogue of vite's "trusted by" strip — docvia is in public preview,
// so we show the render targets it works with, not customer logos.
const frameworks = ["React", "Svelte", "Next.js", "Vite", "Astro", "Static HTML"];
</script>

<section class="border-b border-hairline bg-canvas">
	<div class="px-6 pt-10 pb-6 md:px-10">
		<p class="text-center text-[13px] font-medium tracking-wide text-muted">
			One source, many render targets
		</p>
	</div>
	<div
		class="grid grid-cols-2 divide-x divide-y divide-hairline border-t border-hairline sm:grid-cols-3 md:grid-cols-6 md:divide-y-0"
	>
		{#each frameworks as fw}
			<div
				class="flex items-center justify-center px-4 py-7 text-[14px] font-semibold text-body-strong"
			>
				{fw}
			</div>
		{/each}
	</div>
</section>
