<script lang="ts">
import { Plus } from "@lucide/svelte";
import RequestView from "#lib/components/api-workspace/request-view.svelte";
import { workspace } from "#lib/components/api-workspace/workspace.svelte.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import type { PageProps } from "./$types";

let { data }: PageProps = $props();

const draft = $derived(workspace.drafts.find((d) => d.id === workspace.activeDraft));
</script>

<svelte:head>
	<title>Drafts · API reference · docvia</title>
</svelte:head>

{#if draft}
	{#key draft.id}
		<RequestView {draft} proxy={data.proxy} />
	{/key}
{:else}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
		<p class="font-display text-ink text-xl tracking-tight">Drafts</p>
		<p class="max-w-sm text-muted text-sm">
			Requests to any URL, saved in this browser. They go straight from your browser, so the server
			must allow it (CORS).
		</p>
		<Button size="sm" onclick={() => workspace.addDraft()}><Plus /> New request</Button>
	</div>
{/if}
