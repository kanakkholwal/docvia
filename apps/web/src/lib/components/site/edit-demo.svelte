<script lang="ts">
import { onMount } from "svelte";

// An illustration of the dev cache; the 50 ms is the measured 300-page edit (runtime.json).
const files = ["index.md", "getting-started.md", "guides/config.md", "guides/search.md", "api/source.md"];

let active = $state<number | null>(null);
let compiling = $state(false);
let touched = $state(false);
let hovering = $state(false);
let root: HTMLElement;

function edit(i: number, byUser = true) {
	if (byUser) touched = true;
	active = i;
	compiling = true;
	setTimeout(() => (compiling = false), 280);
}

onMount(() => {
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	let visible = false;
	const io = new IntersectionObserver(([e]) => (visible = e?.isIntersecting ?? false));
	io.observe(root);
	let next = 1;
	const timer = setInterval(() => {
		if (!visible || touched || hovering) return;
		edit(next % files.length, false);
		next++;
	}, 2400);
	return () => {
		clearInterval(timer);
		io.disconnect();
	};
});
</script>

<div bind:this={root} onpointerenter={() => (hovering = true)} onpointerleave={() => (hovering = false)} role="group" aria-label="Dev cache illustration">
	<ul class="-mx-1 overflow-hidden rounded-lg">
		{#each files as file, i}
			{@const hot = active === i}
			<li class="border-b border-dashed border-hairline-strong last:border-0">
				<button
					type="button"
					onclick={() => edit(i)}
					class="row relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left font-mono text-sm transition-[background-color,scale] duration-(--duration-fast) hover:bg-ink/[0.03] active:scale-(--press-scale-row)"
					data-hot={hot}
					data-compiling={hot && compiling}
				>
					<span class="truncate text-ink">{file}</span>
					<span class="status shrink-0 tabular-nums {hot ? 'text-brand-ink' : 'text-muted'}">
						{hot ? (compiling ? "compiling" : "recompiled · ~50 ms") : "cached"}
					</span>
				</button>
			</li>
		{/each}
	</ul>
	<p class="mt-3 font-mono text-xs text-muted">
		{active === null ? "Click a file to edit it." : `1 of ${files.length} pages recompiled, ${files.length - 1} served from cache.`}
	</p>
</div>

<style>
	/* A violet sweep crosses the row while it compiles. */
	.row::before {
		content: "";
		position: absolute;
		inset: 0;
		background: color-mix(in oklab, var(--brand) 14%, transparent);
		clip-path: inset(0 100% 0 0);
		transition: clip-path var(--duration-slow) var(--ease-out);
		pointer-events: none;
	}
	.row[data-compiling="true"]::before {
		clip-path: inset(0 0 0 0);
	}
	.row[data-hot="true"]:not([data-compiling="true"])::before {
		clip-path: inset(0 0 0 0);
		opacity: 0.5;
	}
	.status {
		transition: color var(--duration-fast) var(--ease-out);
	}
	@media (prefers-reduced-motion: reduce) {
		.row::before {
			transition: none;
		}
	}
</style>
