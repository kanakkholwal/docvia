<script lang="ts">
import { goto } from "$app/navigation";
import { cn } from "$lib/utils";
import { createFetchClient, type SearchResult } from "@docvia/search";
import { CornerDownLeft, FileText, Search, X } from "@lucide/svelte";
import { onMount, tick } from "svelte";
import { cubicOut } from "svelte/easing";
import { fade, scale } from "svelte/transition";

// Headless search: queries hit the server `/api/search` endpoint, which holds
// the Orama index in memory. No index payload is downloaded to the browser.
const searcher = createFetchClient("/api/search");

/**
 * Move a node to `document.body`. The trigger lives inside the header's
 * `backdrop-blur` pill — and `backdrop-filter` establishes a containing block
 * for `position: fixed` descendants, which would trap the overlay inside the
 * nav bar. Portalling to `<body>` escapes that stacking context so the
 * backdrop and dialog cover the full viewport.
 */
function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		},
	};
}

let open = $state(false);
let query = $state("");
let results = $state<SearchResult[]>([]);
let activeIndex = $state(0);
let status = $state<"idle" | "searching" | "ready" | "error">("idle");
let inputEl = $state<HTMLInputElement>();
let listEl = $state<HTMLUListElement>();
let isMac = $state(true);

let debounce: ReturnType<typeof setTimeout>;
// Monotonic id so out-of-order /api/search responses can't overwrite newer ones.
let searchId = 0;

async function openDialog() {
	open = true;
	await tick();
	inputEl?.focus();
}

function closeDialog() {
	open = false;
	query = "";
	results = [];
	activeIndex = 0;
	status = "idle";
}

function onInput() {
	clearTimeout(debounce);
	debounce = setTimeout(runSearch, 120);
}

async function runSearch() {
	const term = query.trim();
	if (!term) {
		results = [];
		activeIndex = 0;
		status = "idle";
		return;
	}
	const id = ++searchId;
	status = "searching";
	try {
		const hits = await searcher.search(term, { limit: 8 });
		if (id !== searchId) return; // superseded by a newer search
		results = hits;
		status = "ready";
	} catch {
		if (id !== searchId) return;
		results = [];
		status = "error";
	}
	activeIndex = 0;
}

/** Map an indexed section back to its docs route + anchor. */
function hrefFor(r: SearchResult): string {
	const path = r.slug === "index" ? "/" : `/${r.slug}`;
	return r.sectionId && r.sectionId !== "_top" ? `${path}#${r.sectionId}` : path;
}

const SNIPPET_RADIUS = 60;
const SNIPPET_LENGTH = 200;

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a short excerpt of a section's text centred on the first matching
 * query term, split into segments so matches can be wrapped in `<mark>`.
 * A segment is a "hit" when its text equals one of the query terms — which
 * holds because `split()` breaks the slice on exactly those terms.
 */
function snippetSegments(
	content: string,
	rawQuery: string,
): { text: string; hit: boolean }[] {
	const terms = rawQuery
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter((t) => t.length > 1);
	const collapsed = content.replace(/\s+/g, " ").trim();
	if (terms.length === 0 || !collapsed) {
		return [{ text: collapsed.slice(0, SNIPPET_LENGTH), hit: false }];
	}

	const lower = collapsed.toLowerCase();
	let first = -1;
	for (const t of terms) {
		const idx = lower.indexOf(t);
		if (idx !== -1 && (first === -1 || idx < first)) first = idx;
	}
	if (first === -1) {
		return [{ text: collapsed.slice(0, SNIPPET_LENGTH), hit: false }];
	}

	const start = Math.max(0, first - SNIPPET_RADIUS);
	const end = Math.min(collapsed.length, start + SNIPPET_LENGTH);
	let slice = collapsed.slice(start, end);
	if (start > 0) slice = `…${slice}`;
	if (end < collapsed.length) slice = `${slice}…`;

	const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
	return slice
		.split(re)
		.filter((part) => part.length > 0)
		.map((part) => ({ text: part, hit: terms.includes(part.toLowerCase()) }));
}

function selectResult(r: SearchResult) {
	void goto(hrefFor(r));
	closeDialog();
}

function onDialogKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		e.preventDefault();
		closeDialog();
	} else if (e.key === "ArrowDown") {
		e.preventDefault();
		activeIndex = Math.min(activeIndex + 1, results.length - 1);
		scrollActiveIntoView();
	} else if (e.key === "ArrowUp") {
		e.preventDefault();
		activeIndex = Math.max(activeIndex - 1, 0);
		scrollActiveIntoView();
	} else if (e.key === "Enter" && results[activeIndex]) {
		e.preventDefault();
		selectResult(results[activeIndex]);
	}
}

function scrollActiveIntoView() {
	tick().then(() => {
		listEl
			?.querySelectorAll("[data-result]")
			[activeIndex]?.scrollIntoView({ block: "nearest" });
	});
}

onMount(() => {
	isMac = /mac|iphone|ipad/i.test(navigator.platform);

	function onGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
			e.preventDefault();
			open ? closeDialog() : openDialog();
		}
	}
	window.addEventListener("keydown", onGlobalKeydown);
	return () => window.removeEventListener("keydown", onGlobalKeydown);
});
</script>

<!-- Trigger: search-field shape on md+, icon button on mobile -->
<button
	type="button"
	onclick={openDialog}
	aria-label="Search documentation"
	class="inline-flex h-9 w-9 items-center justify-center rounded-full text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink md:hidden"
>
	<Search class="h-4 w-4" />
</button>

<button
	type="button"
	onclick={openDialog}
	class="hidden h-9 items-center gap-2 rounded-full border border-hairline bg-surface-card/60 pl-3 pr-1.5 text-[13px] text-muted transition-colors duration-(--motion-fast) hover:border-hairline-strong hover:text-body md:inline-flex"
>
	<Search class="h-3.5 w-3.5" />
	<span>Search docs</span>
	<kbd
		class="ml-2 inline-flex items-center gap-0.5 rounded-md border border-hairline bg-canvas px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted"
	>
		{isMac ? "⌘" : "Ctrl"}K
	</kbd>
</button>

{#if open}
	<!-- Portalled to <body> so the overlay escapes the header's backdrop-blur
	     containing block and covers the whole viewport. -->
	<div use:portal>
		<!-- Backdrop -->
		<div
			class="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
			transition:fade={{ duration: 120 }}
			onclick={closeDialog}
			role="presentation"
		></div>

		<!-- Dialog -->
		<div
			class="fixed inset-x-0 top-[12vh] z-50 mx-auto w-[calc(100%-2rem)] max-w-xl"
			transition:scale={{ duration: 200, start: 0.97, easing: cubicOut }}
		>
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Search documentation"
			tabindex="-1"
			onkeydown={onDialogKeydown}
			class="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-[0_16px_48px_-12px_rgba(10,10,10,0.35)]"
		>
			<!-- Search field -->
			<div class="flex items-center gap-3 border-b border-hairline px-4">
				<Search class="h-4 w-4 shrink-0 text-muted" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={onInput}
					type="text"
					placeholder="Search the docs…"
					autocomplete="off"
					spellcheck="false"
					class="h-12 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted-soft focus:outline-none focus-visible:outline-none"
				/>
				<button
					type="button"
					onclick={closeDialog}
					aria-label="Close search"
					class="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>

			<!-- Results -->
			<div class="max-h-[55vh] overflow-y-auto p-2">
				{#if status === "searching" && results.length === 0}
					<p class="px-3 py-8 text-center text-sm text-muted">
						Searching…
					</p>
				{:else if status === "error"}
					<p class="px-3 py-8 text-center text-sm text-error">
						Search is unavailable right now. Please try again later.
					</p>
				{:else if query.trim() && results.length === 0}
					<p class="px-3 py-8 text-center text-sm text-muted">
						No results for <span class="font-medium text-body">“{query}”</span>
					</p>
				{:else if results.length === 0}
					<p class="px-3 py-8 text-center text-sm text-muted">
						Search section titles and page content across the docs.
					</p>
				{:else}
					<ul bind:this={listEl} class="flex flex-col gap-0.5">
						{#each results as result, i (result.slug + result.sectionId)}
							<li>
								<a
									data-result
									href={hrefFor(result)}
									onclick={(e) => {
										e.preventDefault();
										selectResult(result);
									}}
									onmouseenter={() => (activeIndex = i)}
									class={cn(
										"flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors duration-(--motion-fast)",
										i === activeIndex
											? "bg-surface-card"
											: "hover:bg-surface-card/60",
									)}
								>
									<span
										class={cn(
											"mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-hairline",
											i === activeIndex
												? "bg-canvas text-ink"
												: "bg-surface-card text-muted",
										)}
									>
										<FileText class="h-3.5 w-3.5" />
									</span>
									<span class="min-w-0 flex-1">
										<span class="flex items-baseline gap-2">
											<span
												class="min-w-0 flex-1 truncate text-sm font-medium text-ink"
											>
												{result.sectionTitle}
											</span>
											<span
												class="shrink-0 truncate text-[11px] text-muted-soft"
											>
												{result.pageTitle}
											</span>
										</span>
										<span
											class="mt-0.5 block text-xs leading-relaxed text-muted line-clamp-2"
										>
											{#each snippetSegments(result.content, query) as seg}{#if seg.hit}<mark
														class="rounded-[3px] bg-brand-peach/40 px-0.5 font-medium text-inherit"
														>{seg.text}</mark
													>{:else}{seg.text}{/if}{/each}
										</span>
									</span>
									{#if i === activeIndex}
										<CornerDownLeft
											class="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted"
										/>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Footer hints -->
			<div
				class="flex items-center gap-4 border-t border-hairline bg-surface-soft px-4 py-2 text-[11px] text-muted"
			>
				<span class="flex items-center gap-1">
					<kbd class="rounded border border-hairline bg-canvas px-1 py-0.5 font-mono">↑</kbd>
					<kbd class="rounded border border-hairline bg-canvas px-1 py-0.5 font-mono">↓</kbd>
					to navigate
				</span>
				<span class="flex items-center gap-1">
					<kbd class="rounded border border-hairline bg-canvas px-1 py-0.5 font-mono">↵</kbd>
					to select
				</span>
				<span class="flex items-center gap-1">
					<kbd class="rounded border border-hairline bg-canvas px-1 py-0.5 font-mono">esc</kbd>
					to close
				</span>
				<span class="ml-auto flex items-center gap-1">
					<span class="h-1 w-1 rounded-full bg-brand-coral"></span>
					Powered by <span class="font-medium text-body">@docvia/search</span>
				</span>
			</div>
		</div>
	</div>
	</div>
{/if}
