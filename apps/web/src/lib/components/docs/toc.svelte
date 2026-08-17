<script lang="ts">
import { cn } from "$lib/utils";
import { ArrowUp, List } from "@lucide/svelte";

type Heading = { depth: number; text: string; id: string };
type Section = { heading: Heading; children: Heading[] };

let {
	headings = [],
	variant = "rail",
}: { headings?: Heading[]; variant?: "rail" | "inline" } = $props();

const items = $derived(headings.filter((h) => h.depth === 2 || h.depth === 3));

// H3s hang off the H2 above them. A page that opens on an H3 keeps it at the
// top level rather than dropping it.
const sections = $derived.by(() => {
	const out: Section[] = [];
	for (const h of items) {
		if (h.depth === 2 || out.length === 0) out.push({ heading: h, children: [] });
		else out[out.length - 1].children.push(h);
	}
	return out;
});

let activeId = $state("");
let listEl = $state<HTMLElement | null>(null);
let inlineOpen = $state(false);

// Guards the scrollspy while a jump or a deep link owns the highlight, so the
// marker does not race down every heading the smooth scroll passes through.
let locked = false;
let lockTimer: ReturnType<typeof setTimeout> | undefined;

function reducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// An $effect, not onMount: this component lives in the docs layout, so the same
// instance survives every [...slug] navigation and onMount would wire the
// observer to the first page's headings forever.
$effect(() => {
	if (variant !== "rail") return;
	const current = items;
	if (current.length === 0) {
		activeId = "";
		return;
	}

	const els = current
		.map((h) => document.getElementById(h.id))
		.filter((el): el is HTMLElement => el !== null);
	if (els.length === 0) return;

	const visible = new Set<HTMLElement>();
	const hash = decodeURIComponent(location.hash.slice(1));
	if (current.some((h) => h.id === hash)) {
		activeId = hash;
		locked = true;
	}

	function pick() {
		if (locked) return;
		if (visible.size > 0) {
			// Topmost wins. Taking the last entry in the batch picks the
			// bottom-most heading, which is wrong whenever the reader scrolls up.
			let top: HTMLElement | null = null;
			for (const el of visible) {
				const y = el.getBoundingClientRect().top;
				if (!top || y < top.getBoundingClientRect().top) top = el;
			}
			if (top) activeId = top.id;
			return;
		}
		// Nothing in the band: the last heading scrolled above it still applies.
		let last = els[0];
		for (const el of els) {
			if (el.getBoundingClientRect().top < 96) last = el;
		}
		activeId = last.id;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const el = entry.target as HTMLElement;
				if (entry.isIntersecting) visible.add(el);
				else visible.delete(el);
			}
			pick();
		},
		// Activate a heading once it sits just below the sticky header.
		{ rootMargin: "-96px 0px -70% 0px", threshold: 0 },
	);
	for (const el of els) observer.observe(el);

	// `scroll` also fires for the browser's own hash jump; these two do not.
	function release() {
		locked = false;
		pick();
	}
	window.addEventListener("wheel", release, { once: true, passive: true });
	window.addEventListener("touchmove", release, { once: true, passive: true });

	return () => {
		observer.disconnect();
		clearTimeout(lockTimer);
		window.removeEventListener("wheel", release);
		window.removeEventListener("touchmove", release);
	};
});

// Long pages run to 38 anchors, well past the rail's own height. This follows
// the reader continuously, so it eases rather than snapping.
$effect(() => {
	const box = listEl;
	if (!box || !activeId) return;
	const el = box.querySelector<HTMLElement>(`[data-id="${CSS.escape(activeId)}"]`);
	if (!el) return;
	const top = el.offsetTop;
	if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
		box.scrollTo({
			top: top - box.clientHeight / 2 + el.offsetHeight / 2,
			behavior: reducedMotion() ? "instant" : "smooth",
		});
	}
});

// `scroll-margin-top` on the headings (prose.svelte) keeps the target clear of
// the sticky header, so `block: "start"` lands correctly.
function jump(event: MouseEvent, id: string) {
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
	const el = document.getElementById(id);
	if (!el) return;
	event.preventDefault();

	inlineOpen = false;
	activeId = id;
	locked = true;
	clearTimeout(lockTimer);
	lockTimer = setTimeout(() => (locked = false), 700);

	el.scrollIntoView({
		behavior: reducedMotion() ? "instant" : "smooth",
		block: "start",
	});
	history.replaceState(null, "", `#${id}`);
}

function toTop() {
	window.scrollTo({ top: 0, behavior: reducedMotion() ? "instant" : "smooth" });
}
</script>

{#snippet row(h: Heading, interactive: boolean, nested: boolean)}
	{@const active = interactive && activeId === h.id}
	<a
		href={`#${h.id}`}
		data-id={h.id}
		onclick={(event) => jump(event, h.id)}
		aria-current={active ? "location" : undefined}
		class={cn(
			"-ml-px block border-l-2 py-1.5 pr-2 pl-3 transition-colors duration-(--motion-fast)",
			nested && "text-[13px]",
			active
				? "border-brand font-medium text-ink"
				: "border-transparent text-muted hover:text-body",
		)}
	>
		{h.text}
	</a>
{/snippet}

{#snippet tree(interactive: boolean)}
	<ul class="flex flex-col border-l border-hairline">
		{#each sections as section (section.heading.id)}
			<li>
				{@render row(section.heading, interactive, false)}
				{#if section.children.length}
					<!-- A second track, indented: the H3s read as belonging to the H2
					     above rather than as siblings at a deeper padding. -->
					<ul class="ml-3 flex flex-col border-l border-hairline">
						{#each section.children as child (child.id)}
							<li>{@render row(child, interactive, true)}</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{#if items.length}
	{#if variant === "inline"}
		<!-- Below xl the rail is gone entirely, leaving no way to see the shape of
		     a page that can run to 38 headings. -->
		<div class="mb-10 rounded-lg border border-hairline bg-surface-soft xl:hidden">
			<button
				type="button"
				aria-expanded={inlineOpen}
				aria-controls="toc-inline"
				onclick={() => (inlineOpen = !inlineOpen)}
				class="flex min-h-11 w-full items-center gap-2 px-4 text-left text-[13px] font-medium text-body transition-colors duration-(--motion-fast) hover:text-ink"
			>
				<List aria-hidden="true" class="h-4 w-4 shrink-0" />
				On this page
				<span class="ml-auto font-mono text-[12px] text-muted">{items.length}</span>
			</button>
			<div
				class="grid transition-[grid-template-rows] duration-(--motion-base) ease-out"
				style:grid-template-rows={inlineOpen ? "1fr" : "0fr"}
			>
				<div class="overflow-hidden">
					<nav id="toc-inline" inert={!inlineOpen} aria-label="On this page" class="px-4 pb-4 text-sm">
						{@render tree(false)}
					</nav>
				</div>
			</div>
		</div>
	{:else}
		<nav aria-label="On this page" class="text-sm">
			<p class="label-meta mb-3">On this page</p>
			<div
				bind:this={listEl}
				class="scrollbar-transparent relative max-h-[calc(100vh-13rem)] overflow-y-auto"
			>
				{@render tree(true)}
			</div>
			<button
				type="button"
				onclick={toTop}
				class="mt-4 inline-flex items-center gap-1.5 border-t border-hairline pt-4 text-[13px] text-muted transition-colors duration-(--motion-fast) hover:text-ink"
			>
				<ArrowUp aria-hidden="true" class="h-3.5 w-3.5" />
				Back to top
			</button>
		</nav>
	{/if}
{/if}
