<script lang="ts">
import { page } from "$app/state";
import { cn } from "#lib/cn.ts";
import { RollText } from "#lib/components/text/roll-text/index.ts";
import { tick } from "svelte";

type Props = {
	title: string;
	prefix: string;
	items: { label: string; url: string }[];
	first?: boolean;
	mobile?: boolean;
};
let { title, prefix, items, first = false, mobile = false }: Props = $props();

// The portfolio's nav group: one raised pill marks the active row and slides between rows.
let list = $state<HTMLUListElement>();
let box = $state<{ y: number; h: number } | null>(null);
let glide = $state(false);
const active = $derived(items.findIndex((item) => item.url === page.url.pathname));

$effect(() => {
	active;
	tick().then(() => {
		const row = list?.querySelector<HTMLElement>("[aria-current='page']")?.closest("li");
		if (row) box = { y: row.offsetTop, h: row.offsetHeight };
	});
});

// Placed before it may move, so the first paint never slides in from the top.
$effect(() => {
	if (!box || glide) return;
	const id = requestAnimationFrame(() => (glide = true));
	return () => cancelAnimationFrame(id);
});
</script>

<nav aria-label={title} class={cn("pt-5", first ? "mt-2" : "mt-5 border-t border-dashed border-hairline-strong")}>
	<p class="mb-2 flex items-baseline gap-2 font-mono text-xs tracking-widest text-muted uppercase">
		<span class="truncate">{title}</span>
		{#if prefix}<span class="normal-case tracking-normal opacity-70">{prefix}</span>{/if}
		<span class="ml-auto tracking-normal tabular-nums opacity-70">{items.length}</span>
	</p>
	<ul bind:this={list} class="relative -mx-2 flex flex-col">
		<span
			aria-hidden="true"
			class={cn(
				"pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-well-body shadow-surface ring-1 ring-ink/[0.04]",
				glide && "transition-[translate,height,opacity] duration-(--duration-slow) ease-(--ease-out) motion-reduce:transition-none",
				box && active >= 0 ? "opacity-100" : "opacity-0",
			)}
			style={box ? `translate: 0 ${box.y}px; height: ${box.h}px` : undefined}
		></span>
		{#each items as item (item.url)}
			{@const current = item.url === page.url.pathname}
			<li class="relative">
				<a
					href={item.url}
					aria-current={current ? "page" : undefined}
					class={cn(
						"group/roll flex items-center rounded-lg px-2 text-sm transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-(--press-scale-row)",
						mobile ? "min-h-11" : "h-8",
						current ? "font-medium text-ink" : "text-muted hover:bg-ink/[0.03] hover:text-ink",
					)}
				>
					<RollText text={item.label} groupHover disabled={current} size="sm" class="min-w-0 flex-1 cursor-[inherit] truncate" />
				</a>
			</li>
		{/each}
	</ul>
</nav>
