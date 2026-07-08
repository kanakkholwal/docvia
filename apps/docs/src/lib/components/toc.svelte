<script lang="ts">
import { cn } from "$lib/utils";
import { onMount } from "svelte";

type Heading = { depth: number; text: string; id: string };
let { headings = [] }: { headings?: Heading[] } = $props();

// A right-rail table of contents lists the H2/H3 anchors of the page.
const items = $derived(headings.filter((h) => h.depth === 2 || h.depth === 3));

let activeId = $state("");

onMount(() => {
	if (items.length === 0) return;
	const els = items
		.map((h) => document.getElementById(h.id))
		.filter((el): el is HTMLElement => el !== null);
	if (els.length === 0) return;

	activeId = els[0].id;
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) activeId = entry.target.id;
			}
		},
		// Activate a heading once it sits just below the sticky header.
		{ rootMargin: "-96px 0px -70% 0px", threshold: 0 },
	);
	for (const el of els) observer.observe(el);
	return () => observer.disconnect();
});
</script>

{#if items.length}
	<nav aria-label="On this page" class="text-sm">
		<p
			class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted"
		>
			On this page
		</p>
		<ul class="flex flex-col border-l border-hairline">
			{#each items as h (h.id)}
				<li>
					<a
						href={`#${h.id}`}
						aria-current={activeId === h.id ? "location" : undefined}
						class={cn(
							"-ml-px block border-l-2 py-1 transition-colors duration-(--motion-fast)",
							h.depth === 3 ? "pl-6" : "pl-4",
							activeId === h.id
								? "border-brand font-medium text-ink"
								: "border-transparent text-muted hover:text-body",
						)}
					>
						{h.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
