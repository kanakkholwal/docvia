<script lang="ts">
import type { ApiOperation, ApiSecurity } from "@docvia/plugin-openapi/source";
import type { Snippet } from "svelte";
import { playgroundAuth } from "#lib/components/openapi/playground-auth.svelte.ts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#lib/components/ui/collapsible/index.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.ts";
import { Textarea } from "#lib/components/ui/textarea/index.ts";
import KeyValueTable from "./key-value-table.svelte";
import type { RequestState } from "./workspace.svelte.ts";

let {
	request,
	op,
	onchange,
}: { request: RequestState; op?: ApiOperation; onchange?: () => void } = $props();

const auth = $derived<readonly ApiSecurity[]>(op?.security[Number(request.auth)] ?? []);
const allowsBody = $derived(request.method !== "GET" && request.method !== "HEAD");
const count = (rows: { enabled: boolean; name: string }[]) =>
	rows.filter((r) => r.enabled && r.name).length;

function placeholder(scheme: ApiSecurity): string {
	if (scheme.type === "apiKey") return `${scheme.paramName ?? "API key"} value`;
	if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "basic") return "username:password";
	return scheme.bearerFormat ? `${scheme.bearerFormat} token` : "Bearer token";
}
</script>

{#snippet section(title: string, badge: string | number | undefined, body: Snippet)}
	<Collapsible open class="border-border border-b">
		<CollapsibleTrigger class="h-10 rounded-none px-3 text-ink hover:bg-foreground/[0.03] hover:text-ink">
			<span class="flex-1">{title}</span>
			{#if badge}<span class="font-normal text-muted text-xs">{badge}</span>{/if}
		</CollapsibleTrigger>
		<CollapsibleContent class="border-border border-t px-0 pb-0 text-sm">
			{@render body()}
		</CollapsibleContent>
	</Collapsible>
{/snippet}

{#snippet authBody()}
	<div class="flex flex-col gap-2 p-3">
		{#if op && op.security.length > 1}
			<Select
				type="single"
				bind:value={request.auth}
				items={op.security.map((alt, i) => ({ value: String(i), label: alt.map((s) => s.name).join(" + ") }))}
			>
				<SelectTrigger size="sm" aria-label="Authorization scheme" class="w-full"><SelectValue /></SelectTrigger>
				<SelectContent>
					{#each op.security as alt, i (i)}<SelectItem value={String(i)} label={alt.map((s) => s.name).join(" + ")} />{/each}
				</SelectContent>
			</Select>
		{/if}
		{#each auth as scheme (scheme.name)}
			<label class="flex items-center gap-3">
				<span class="w-32 shrink-0 font-medium text-ink">{scheme.name}</span>
				<input
					type="password"
					autocomplete="off"
					class="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
					placeholder={placeholder(scheme)}
					bind:value={() => playgroundAuth[scheme.name] ?? "", (v) => (playgroundAuth[scheme.name] = v)}
				/>
			</label>
		{/each}
		<p class="text-muted text-xs">Held in memory for this visit, shared by every request in this API. Never saved.</p>
	</div>
{/snippet}

{#snippet pathBody()}<KeyValueTable rows={request.path} label="Path parameter" addable={false} toggleable={false} {onchange} />{/snippet}
{#snippet queryBody()}<KeyValueTable rows={request.query} label="Query parameter" {onchange} />{/snippet}
{#snippet headersBody()}<KeyValueTable rows={request.headers} label="Header" {onchange} />{/snippet}
{#snippet bodyBody()}
	<div class="flex flex-col">
		<label class="flex items-center gap-2 border-border border-b px-3 py-1.5 text-muted text-xs">
			Content-Type
			<input
				class="h-7 min-w-0 flex-1 bg-transparent text-ink outline-none"
				bind:value={request.contentType}
				oninput={() => onchange?.()}
				aria-label="Content type"
			/>
		</label>
		<Textarea
			bind:value={request.body}
			rows={10}
			autoGrow
			maxRows={28}
			spellcheck={false}
			oninput={() => onchange?.()}
			aria-label="Request body"
			class="rounded-none border-0 bg-transparent font-mono text-xs focus-visible:ring-0"
		/>
	</div>
{/snippet}

<div class="flex flex-col">
	{#if op && op.security.length > 0}{@render section("Authentication", auth.map((s) => s.name).join(" + "), authBody)}{/if}
	{#if request.path.length > 0}{@render section("Path parameters", request.path.length, pathBody)}{/if}
	{@render section("Query parameters", count(request.query) || undefined, queryBody)}
	{@render section("Headers", count(request.headers) || undefined, headersBody)}
	{#if allowsBody}{@render section("Body", request.contentType || undefined, bodyBody)}{/if}
</div>
