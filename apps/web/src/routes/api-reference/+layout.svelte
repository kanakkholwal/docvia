<script lang="ts">
import type { ApiMethod } from "@docvia/plugin-openapi/source";
import { BookOpen, Menu, Plus, Search, X } from "@lucide/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { onMount } from "svelte";
import { type TabRef, tabKey, workspace } from "#lib/components/api-workspace/workspace.svelte.ts";
import ThemeToggle from "#lib/components/theme-toggle.svelte";
import type { BadgeVariant } from "#lib/components/ui/badge/index.ts";
import { DocsNav } from "#lib/components/ui/docs-nav/index.ts";
import { cn } from "#lib/cn.js";
import type { LayoutProps } from "./$types";

let { data, children }: LayoutProps = $props();

let query = $state("");
let navOpen = $state(false);

const TONE: Record<ApiMethod, BadgeVariant> = {
	GET: "info",
	POST: "success",
	PUT: "warning",
	PATCH: "warning",
	DELETE: "destructive",
	OPTIONS: "secondary",
	HEAD: "secondary",
	TRACE: "secondary",
};
const SHORT: Partial<Record<ApiMethod, string>> = { DELETE: "DEL", OPTIONS: "OPT" };

onMount(() => {
	workspace.load();
	const hash = location.hash.slice(1);
	if (page.url.pathname.endsWith("/drafts") && hash) workspace.activeDraft = hash;
});

const needle = $derived(query.trim().toLowerCase());
const matches = (text: string) => !needle || text.toLowerCase().includes(needle);
const opsByTag = $derived(
	[
		...data.index.tags.map((tag) => ({
			id: tag.slug,
			label: tag.name,
			ops: data.index.operations.filter((op) => op.tags[0] === tag.name),
		})),
		{ id: "other", label: "Other", ops: data.index.operations.filter((op) => !data.index.tags.some((t) => t.name === op.tags[0])) },
	].filter((g) => g.ops.length > 0),
);
const sections = $derived([
	...opsByTag
		.map((g) => ({
			id: g.id,
			label: g.label,
			items: g.ops
				.filter((op) => matches(`${op.summary} ${op.path} ${op.method}`))
				.map((op) => ({
					href: `/api-reference/${op.slug}`,
					label: op.summary,
					badge: SHORT[op.method] ?? op.method,
					badgeVariant: TONE[op.method],
				})),
		}))
		.filter((s) => s.items.length > 0)
		.map((s) => ({ ...s, count: s.items.length })),
	...(workspace.drafts.length > 0
		? [
				{
					id: "drafts",
					label: "Drafts",
					count: workspace.drafts.length,
					items: workspace.drafts
						.filter((d) => matches(`${d.name} ${d.request.url}`))
						.map((d) => ({ href: `/api-reference/drafts#${d.id}`, label: d.name, badge: d.request.method.slice(0, 4) })),
				},
			]
		: []),
]);

const current = $derived(
	page.url.pathname.endsWith("/drafts") && workspace.activeDraft
		? `/api-reference/drafts#${workspace.activeDraft}`
		: page.url.pathname,
);

function hrefOf(tab: TabRef) {
	return tab.kind === "operation" ? `/api-reference/${tab.slug}` : `/api-reference/drafts#${tab.id}`;
}
function labelOf(tab: TabRef) {
	if (tab.kind === "operation") {
		const op = data.index.operations.find((o) => o.slug === tab.slug);
		return { method: op?.method ?? "GET", text: op?.summary ?? tab.slug };
	}
	const draft = workspace.drafts.find((d) => d.id === tab.id);
	return { method: (draft?.request.method ?? "GET") as ApiMethod, text: draft?.name ?? "Draft" };
}
const isActive = (tab: TabRef) => hrefOf(tab) === current;

function select(href: string, event?: MouseEvent) {
	const draftId = href.split("#")[1];
	if (draftId) {
		event?.preventDefault();
		workspace.open({ kind: "draft", id: draftId });
		goto(`/api-reference/drafts#${draftId}`);
	}
	navOpen = false;
}

function close(tab: TabRef) {
	const wasActive = isActive(tab);
	const next = workspace.close(tab);
	if (!wasActive) return;
	if (next?.kind === "draft") workspace.activeDraft = next.id;
	if (!next) workspace.activeDraft = undefined;
	goto(next ? hrefOf(next) : "/api-reference/drafts");
}

function newDraft() {
	const draft = workspace.addDraft();
	goto(`/api-reference/drafts#${draft.id}`);
	navOpen = false;
}
</script>

<div class="flex h-dvh overflow-hidden bg-background text-body">
	<aside
		class={cn(
			"fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-border border-r bg-background transition-transform md:static md:translate-x-0",
			navOpen ? "translate-x-0" : "-translate-x-full",
		)}
		aria-label="API operations"
	>
		<div class="flex h-12 shrink-0 items-center gap-2 border-border border-b px-4">
			<a href="/" class="font-display text-ink tracking-tight">docvia</a>
			<span class="text-muted text-sm">/ {data.index.title}</span>
			<button type="button" class="ml-auto md:hidden" aria-label="Close navigation" onclick={() => (navOpen = false)}>
				<X class="size-4" />
			</button>
		</div>
		<div class="shrink-0 p-3">
			<label class="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
				<Search class="size-3.5 shrink-0 text-muted" />
				<input class="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted" placeholder="Search requests" bind:value={query} aria-label="Search requests" />
			</label>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
			<DocsNav {sections} {current} label="Requests" onNavigate={select} />
		</div>
		<div class="flex shrink-0 items-center gap-2 border-border border-t p-3">
			<button
				type="button"
				class="inline-flex h-8 flex-1 items-center gap-2 rounded-lg px-2 text-sm text-ink hover:bg-foreground/[0.06]"
				onclick={newDraft}
			>
				<Plus class="size-4" /> New request
			</button>
			<a href="/docs/api-example" class="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-foreground/[0.06] hover:text-ink" aria-label="API docs">
				<BookOpen class="size-4" />
			</a>
			<ThemeToggle />
		</div>
	</aside>

	{#if navOpen}
		<button type="button" class="fixed inset-0 z-30 bg-black/40 md:hidden" aria-label="Close navigation" onclick={() => (navOpen = false)}></button>
	{/if}

	<div class="flex min-w-0 flex-1 flex-col">
		<div class="flex h-12 shrink-0 items-end gap-1 border-border border-b bg-card px-2 pt-2">
			<button type="button" class="mb-2 mr-1 md:hidden" aria-label="Open navigation" onclick={() => (navOpen = true)}>
				<Menu class="size-4" />
			</button>
			<div class="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Open requests">
				{#each workspace.tabs as tab (tabKey(tab))}
					{@const label = labelOf(tab)}
					<div
						class={cn(
							"group/tab flex h-10 max-w-60 shrink-0 items-center gap-1 rounded-t-lg border border-transparent border-b-0 pr-1 pl-3 text-sm",
							isActive(tab) ? "border-border bg-background text-ink" : "text-muted hover:text-ink",
						)}
					>
						<a
							href={hrefOf(tab)}
							role="tab"
							aria-selected={isActive(tab)}
							onclick={(e) => select(hrefOf(tab), e)}
							class="flex min-w-0 items-center gap-2 outline-none focus-visible:underline"
						>
							<span class="font-semibold text-[11px] text-muted">{SHORT[label.method] ?? label.method}</span>
							<span class="truncate">{label.text}</span>
						</a>
						<button
							type="button"
							class={cn(
								"inline-flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-foreground/[0.08] hover:text-ink focus-visible:opacity-100",
								isActive(tab) ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100",
							)}
							aria-label={`Close ${label.text}`}
							onclick={() => close(tab)}
						>
							<X class="size-3" />
						</button>
					</div>
				{/each}
			</div>
		</div>
		<main id="main" class="flex min-h-0 flex-1 flex-col">
			{@render children()}
		</main>
	</div>
</div>
