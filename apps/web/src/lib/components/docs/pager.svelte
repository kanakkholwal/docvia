<script lang="ts">
import { ArrowLeft, ArrowRight } from "@lucide/svelte";

type Link = { title: string; url: string };
let { prev = null, next = null }: { prev?: Link | null; next?: Link | null } =
	$props();
</script>

{#if prev || next}
	<nav
		aria-label="Pagination"
		class="mt-16 grid gap-4 border-t border-hairline pt-8 sm:grid-cols-2"
	>
		{#if prev}
			<a
				href={prev.url}
				class="flex flex-col gap-1 rounded-lg border border-hairline p-4 transition-colors duration-(--motion-fast) hover:border-hairline-strong hover:bg-surface-card"
			>
				<span class="inline-flex items-center gap-1 text-[12px] text-muted">
					<ArrowLeft class="h-3.5 w-3.5" />
					Previous
				</span>
				<span class="font-medium text-ink">{prev.title}</span>
			</a>
		{:else}
			<span></span>
		{/if}

		{#if next}
			<a
				href={next.url}
				class="flex flex-col items-end gap-1 rounded-lg border border-hairline p-4 text-right transition-colors duration-(--motion-fast) hover:border-hairline-strong hover:bg-surface-card sm:col-start-2"
			>
				<span class="inline-flex items-center gap-1 text-[12px] text-muted">
					Next
					<ArrowRight class="h-3.5 w-3.5" />
				</span>
				<span class="font-medium text-ink">{next.title}</span>
			</a>
		{/if}
	</nav>
{/if}
