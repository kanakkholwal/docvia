<script lang="ts">
import { RollText } from "#lib/components/text/roll-text/index.ts";
import { ArrowLeft, ArrowRight } from "@lucide/svelte";

type Link = { title: string; url: string };
let { prev = null, next = null }: { prev?: Link | null; next?: Link | null } = $props();
</script>

{#snippet card(link: Link, dir: "prev" | "next")}
	<a
		href={link.url}
		class="group/roll block rounded-2xl bg-well-rim p-1 transition-[scale] duration-(--duration-fast) active:scale-(--press-scale-sm) {dir === 'next'
			? 'text-right sm:col-start-2'
			: ''}"
	>
		<span class="flex flex-col gap-1 rounded-xl bg-well-body p-4 shadow-surface ring-1 ring-ink/[0.04]">
			<span class="inline-flex items-center gap-1 font-mono text-xs text-muted {dir === 'next' ? 'justify-end' : ''}">
				{#if dir === "prev"}<ArrowLeft class="size-3.5" />{/if}
				{dir === "prev" ? "previous" : "next"}
				{#if dir === "next"}<ArrowRight class="size-3.5" />{/if}
			</span>
			<span class="font-medium text-ink"><RollText text={link.title} groupHover size="md" class="cursor-[inherit]" /></span>
		</span>
	</a>
{/snippet}

{#if prev || next}
	<nav aria-label="Pagination" class="mt-16 grid gap-3 border-t border-dashed border-hairline-strong pt-8 sm:grid-cols-2">
		{#if prev}{@render card(prev, "prev")}{:else}<span></span>{/if}
		{#if next}{@render card(next, "next")}{/if}
	</nav>
{/if}
