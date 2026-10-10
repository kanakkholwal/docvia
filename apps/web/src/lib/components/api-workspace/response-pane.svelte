<script lang="ts">
import { Send } from "@lucide/svelte";
import { Badge } from "#lib/components/ui/badge/index.ts";
import { CodeBlock } from "#lib/components/ui/code-block/index.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.ts";
import type { Result } from "./workspace.svelte.ts";

let { result, sending = false }: { result: Result | undefined; sending?: boolean } = $props();

let tab = $state("body");

const ROUTE_LABEL = {
	"same-origin": "Same origin",
	proxy: "Through this site's proxy",
	direct: "Direct from your browser",
} as const;

const tone = (status: number) =>
	status < 300 ? ("success" as const) : status < 500 ? ("warning" as const) : ("destructive" as const);

function size(bytes: number) {
	return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}
</script>

<section aria-label="Response" aria-live="polite" class="flex min-h-0 flex-1 flex-col">
	<div class="flex h-10 shrink-0 items-center gap-2 border-border border-b px-3 text-sm">
		<span class="font-medium text-ink">Response</span>
		{#if result && "status" in result}
			<Badge variant={tone(result.status)} size="sm">{result.status} {result.statusText}</Badge>
			<span class="text-muted text-xs">{result.ms} ms · {size(result.size)}</span>
		{/if}
		{#if result}<span class="ml-auto text-muted text-xs">{ROUTE_LABEL[result.route]}</span>{/if}
	</div>

	{#if sending && !result}
		<p class="p-6 text-muted text-sm">Sending…</p>
	{:else if !result}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted text-sm">
			<Send class="size-5" />
			<p>Send the request to see its response here.</p>
			<p class="text-xs">Ctrl + Enter sends from anywhere in the editor.</p>
		</div>
	{:else if "error" in result}
		<p class="m-3 rounded-lg bg-[color-mix(in_oklch,var(--destructive)_10%,transparent)] px-3 py-2 text-destructive-strong text-sm">
			{result.error}
		</p>
	{:else}
		<Tabs bind:value={tab} variant="underline" size="sm" class="min-h-0 flex-1 px-3 pt-2">
			<TabsList>
				<TabsTrigger value="body">Body</TabsTrigger>
				<TabsTrigger value="headers">Headers {result.headers.length}</TabsTrigger>
			</TabsList>
			<TabsContent value="body" class="mt-3 min-h-0 pb-3">
				{#if result.body}
					<CodeBlock code={result.body} language={result.contentType?.split(";")[0] ?? "text"} maxHeight="calc(100dvh - 14rem)" />
				{:else}
					<p class="text-muted text-sm">Empty body.</p>
				{/if}
			</TabsContent>
			<TabsContent value="headers" class="mt-3 pb-3">
				<div class="divide-y divide-border rounded-lg border border-border text-sm">
					{#each result.headers as [name, value] (name)}
						<div class="flex gap-3 px-3 py-2">
							<span class="w-44 shrink-0 font-medium text-ink">{name}</span>
							<span class="min-w-0 break-all text-body">{value}</span>
						</div>
					{/each}
				</div>
			</TabsContent>
		</Tabs>
	{/if}
</section>
