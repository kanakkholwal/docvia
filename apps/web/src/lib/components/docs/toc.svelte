<script lang="ts">
import { TableOfContents, type TocItem } from "#lib/components/ui/table-of-contents/index.ts";
import { List } from "@lucide/svelte";

type Heading = { depth: number; text: string; id: string };

let { headings = [], variant = "rail" }: { headings?: Heading[]; variant?: "rail" | "inline" } = $props();

const items = $derived(
	headings
		.filter((h) => h.depth === 2 || h.depth === 3)
		.map((h): TocItem => ({ id: h.id, label: h.text, depth: h.depth as 2 | 3 })),
);
</script>

{#if items.length > 0}
	{#if variant === "inline"}
		<details class="group mb-8 rounded-xl bg-well-rim p-1 xl:hidden">
			<summary class="flex h-10 cursor-pointer list-none items-center gap-2 px-3 text-sm text-body">
				<List class="size-4" />
				On this page
			</summary>
			<div class="rounded-lg bg-well-body p-3">
				<TableOfContents {items} scrollOffset={80} indicator={false} />
			</div>
		</details>
	{:else}
		<p class="mb-3 font-mono text-xs text-muted">On this page</p>
		<TableOfContents {items} scrollOffset={80} />
	{/if}
{/if}
