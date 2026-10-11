<script lang="ts">
import {
	type ApiOperation,
	type ProxyRoute,
	defaultServer,
	sendRequest,
} from "@docvia/plugin-openapi/source";
import { BookOpen, History, Trash2 } from "@lucide/svelte";
import { onMount, untrack } from "svelte";
import MethodBadge from "#lib/components/openapi/method-badge.svelte";
import { playgroundAuth } from "#lib/components/openapi/playground-auth.svelte.ts";
import { Badge } from "#lib/components/ui/badge/index.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { Popover, PopoverContent, PopoverTrigger } from "#lib/components/ui/popover/index.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.ts";
import { composeRequest, displayUrl, missingRequired } from "./compose.ts";
import RequestEditor from "./request-editor.svelte";
import ResponsePane from "./response-pane.svelte";
import { type Draft, type RequestState, requestFor, workspace } from "./workspace.svelte.ts";

type Props =
	| { op: ApiOperation; draft?: undefined; docsUrl?: string; proxy: ProxyRoute }
	| { op?: undefined; draft: Draft; docsUrl?: undefined; proxy: ProxyRoute };
let { op, draft, docsUrl, proxy }: Props = $props();

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const key = untrack(() => (op ? `op:${op.slug}` : `draft:${draft?.id}`));

let origin = $state<string>();
let sending = $state(false);
let attempted = $state(false);
let historyOpen = $state(false);

onMount(() => {
	origin = location.origin;
});

// The route keys this view per tab, so the request is resolved once: operations start from
// the spec, drafts edit their saved request. A relative server wins before the origin is known.
const request: RequestState = untrack(() => {
	workspace.requests[key] ??= op ? requestFor(op, defaultServer(op, undefined)) : (draft as Draft).request;
	return workspace.requests[key] as RequestState;
});
const result = $derived(workspace.results[key]);
const url = $derived(displayUrl(request, op, origin));
const missing = $derived(missingRequired(request));
const entries = $derived(workspace.history.filter((h) => h.key === key).slice(0, 15));

function changed() {
	if (draft) workspace.save();
}

async function send() {
	attempted = true;
	if (!origin || missing.length > 0 || sending || (!op && !request.url.trim())) return;
	sending = true;
	const composed = composeRequest(request, op, origin, playgroundAuth);
	const sent = await sendRequest(composed, origin, proxy);
	workspace.record(key, request, request.method, url, sent);
	sending = false;
}

function restore(id: string) {
	const entry = workspace.history.find((h) => h.id === id);
	if (!entry) return;
	Object.assign(request, structuredClone(entry.request));
	workspace.results[key] = entry.result;
	historyOpen = false;
	changed();
}

function onkeydown(event: KeyboardEvent) {
	if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
		event.preventDefault();
		send();
	}
}

const ago = (at: number) => {
	const s = Math.round((Date.now() - at) / 1000);
	return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : new Date(at).toLocaleString();
};
</script>

<div class="flex min-h-0 flex-1 flex-col" role="presentation" {onkeydown}>
	<div class="flex shrink-0 flex-wrap items-center gap-2 border-border border-b px-4 py-2.5">
		{#if op}
			<h1 class="font-display text-ink text-lg tracking-tight">{op.summary}</h1>
			{#if op.deprecated}<Badge variant="destructive" size="sm">Deprecated</Badge>{/if}
			{#if docsUrl}
				<a href={docsUrl} class="ml-auto inline-flex items-center gap-1.5 text-muted text-xs hover:text-ink">
					<BookOpen class="size-3.5" /> Read the docs
				</a>
			{/if}
		{:else if draft}
			<input
				class="min-w-0 flex-1 bg-transparent font-display text-ink text-lg tracking-tight outline-none"
				bind:value={draft.name}
				oninput={changed}
				aria-label="Request name"
			/>
			<button
				type="button"
				class="inline-flex items-center gap-1.5 text-muted text-xs hover:text-destructive-strong"
				onclick={() => draft && workspace.removeDraft(draft.id)}
			>
				<Trash2 class="size-3.5" /> Delete
			</button>
		{/if}
	</div>

	<div class="flex shrink-0 flex-wrap items-center gap-2 border-border border-b bg-card px-3 py-2 sm:flex-nowrap">
		{#if op}
			<MethodBadge method={op.method} />
			{#if op.servers.length > 1}
				<Select type="single" bind:value={request.url} items={op.servers.map((s) => ({ value: s.url, label: s.description ?? s.url }))}>
					<SelectTrigger size="xs" variant="ghost" aria-label="Server" class="w-40 shrink-0 overflow-hidden text-muted">
						<SelectValue class="min-w-0 truncate" />
					</SelectTrigger>
					<SelectContent size="xs">
						{#each op.servers as s (s.url)}<SelectItem value={s.url} label={s.description ?? s.url} />{/each}
					</SelectContent>
				</Select>
			{/if}
			<span class="order-last min-w-0 basis-full truncate text-ink text-sm sm:order-none sm:basis-auto sm:flex-1" title={url}>{url}</span>
		{:else}
			<Select type="single" bind:value={request.method} items={METHODS.map((m) => ({ value: m, label: m }))}>
				<SelectTrigger size="xs" variant="ghost" aria-label="Method" class="w-24 shrink-0 font-semibold"><SelectValue /></SelectTrigger>
				<SelectContent size="xs">
					{#each METHODS as m (m)}<SelectItem value={m} label={m} />{/each}
				</SelectContent>
			</Select>
			<input
				class="order-last h-8 min-w-0 basis-full rounded-lg border border-input bg-background px-2.5 text-ink text-sm outline-none placeholder:text-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring sm:order-none sm:basis-auto sm:flex-1"
				bind:value={request.url}
				oninput={changed}
				placeholder="https://api.example.com/v1/things"
				aria-label="Request URL"
			/>
		{/if}

		<div class="ml-auto flex items-center gap-2 sm:ml-0">
		<Popover bind:open={historyOpen}>
			<PopoverTrigger
				class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-foreground/[0.06] hover:text-ink"
				aria-label="Request history"
			>
				<History class="size-4" />
			</PopoverTrigger>
			<PopoverContent align="end" class="w-80 p-1">
				{#if entries.length === 0}
					<p class="px-3 py-2 text-muted text-sm">No requests sent yet.</p>
				{:else}
					{#each entries as entry (entry.id)}
						<button
							type="button"
							class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-foreground/[0.06]"
							onclick={() => restore(entry.id)}
						>
							<span class="w-14 shrink-0 font-medium text-ink text-xs">{entry.method}</span>
							<span class="min-w-0 flex-1 truncate text-body text-xs">{entry.url}</span>
							<span class="shrink-0 text-muted text-xs">
								{"status" in entry.result ? entry.result.status : "failed"} · {ago(entry.at)}
							</span>
						</button>
					{/each}
				{/if}
			</PopoverContent>
		</Popover>
		<Button size="sm" onclick={send} loading={sending} loadingLabel="Sending" disabled={!origin}>Send</Button>
		</div>
	</div>

	{#if attempted && missing.length > 0}
		<p class="shrink-0 border-border border-b px-4 py-2 text-destructive-strong text-sm">Fill in {missing.join(", ")} first.</p>
	{/if}

	<div class="flex min-h-0 flex-1 flex-col lg:flex-row">
		<div class="min-h-0 overflow-y-auto border-border lg:w-1/2 lg:border-r">
			<RequestEditor {request} {op} onchange={changed} />
		</div>
		<div class="flex min-h-0 flex-1 flex-col overflow-y-auto border-border border-t lg:border-t-0">
			<ResponsePane {result} {sending} />
		</div>
	</div>
</div>
