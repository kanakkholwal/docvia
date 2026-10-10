<script lang="ts">
import {
	type ApiOperation,
	type ApiParameter,
	type ApiSecurity,
	buildRequestHeaders,
	buildRequestUrl,
	defaultServer,
	missingParameters,
	type ParamValues,
	paramKey,
	resolveServerUrl,
	type SentResponse,
	type FailedRequest,
	sendRequest,
} from "@docvia/plugin-openapi/source";
import { proxyRoute } from "#lib/api-reference.ts";
import { onMount, untrack } from "svelte";
import { Badge } from "#lib/components/ui/badge/index.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { CodeBlock } from "#lib/components/ui/code-block/index.ts";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "#lib/components/ui/field/index.ts";
import { Input } from "#lib/components/ui/input/index.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.ts";
import { Textarea } from "#lib/components/ui/textarea/index.ts";
import ApiPath from "./api-path.svelte";
import MethodBadge from "./method-badge.svelte";
import Panel from "./panel.svelte";
import { playgroundAuth } from "./playground-auth.svelte.ts";

// Mounted per operation (keyed by the parent), so the initial values below are read once on purpose.
let { operation }: { operation: ApiOperation } = $props();
const op = untrack(() => operation);

const literal = (value: string | undefined) =>
	value === undefined ? undefined : value.startsWith('"') ? (JSON.parse(value) as string) : value;

let origin = $state<string>();
let server = $state(defaultServer(op, undefined));
let values = $state<ParamValues>(
	Object.fromEntries(
		op.parameters.map((p) => [paramKey(p.in, p.name), p.example ?? (p.required ? (literal(p.schema.default) ?? "") : "")]),
	),
);
const content = op.requestBody?.contents[0];
let body = $state(content?.examples[0]?.code ?? "");
let alternative = $state("0");
let attempted = $state(false);
let sending = $state(false);
let result = $state<SentResponse | FailedRequest>();
let resultTab = $state("body");

onMount(() => {
	origin = location.origin;
	server = defaultServer(op, origin);
	// Required UUIDs (idempotency keys, request ids) get a fresh one rather than a blank.
	for (const p of op.parameters) {
		const key = paramKey(p.in, p.name);
		if (p.required && !values[key] && p.schema.type === "string<uuid>") values[key] = crypto.randomUUID();
	}
});

const auth = $derived<readonly ApiSecurity[]>(op.security[Number(alternative)] ?? []);
const missing = $derived(missingParameters(op, values));
const url = $derived(buildRequestUrl(op, resolveServerUrl(server, origin), values));
const groups = (["path", "query", "header"] as const)
	.map((location) => ({ location, params: op.parameters.filter((p) => p.in === location) }))
	.filter((g) => g.params.length > 0);
const GROUP_LABEL = { path: "Path", query: "Query", header: "Headers" } as const;

function placeholder(scheme: ApiSecurity): string {
	if (scheme.type === "apiKey") return scheme.paramName ?? "API key";
	if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "basic") return "username:password";
	return scheme.bearerFormat ? `${scheme.bearerFormat} token` : "Token";
}

function enumItems(param: ApiParameter) {
	const items = (param.schema.enum ?? []).map((v) => ({ value: literal(v) ?? v, label: literal(v) ?? v }));
	return param.required ? items : [{ value: "", label: "Not set" }, ...items];
}

async function send() {
	attempted = true;
	if (missing.length > 0) return;
	sending = true;
	const { headers, query } = buildRequestHeaders(op, values, auth, playgroundAuth, body.trim() && content ? content.mediaType : undefined);
	const target = new URL(url);
	for (const [name, value] of query) target.searchParams.append(name, value);
	result = await sendRequest(
		{ method: op.method, url: target.href, headers, body: content ? body : undefined },
		origin ?? location.origin,
		proxyRoute,
	);
	sending = false;
}

function tone(status: number) {
	if (status < 300) return "success" as const;
	if (status < 500) return "warning" as const;
	return "destructive" as const;
}
</script>

<Panel>
	{#snippet header()}
		<span class="font-medium text-ink">Try it</span>
		<span>Sent from your browser; this site proxies the spec's own servers.</span>
		<a href={`/api-reference/${op.slug}`} class="ml-auto font-medium text-ink hover:underline">Open in workspace</a>
	{/snippet}

	<div class="flex flex-col gap-5 p-4">
		<div class="flex items-center gap-3">
			<MethodBadge method={op.method} size="md" />
			<ApiPath path={url} class="min-w-0 flex-1 text-sm" />
			<Button size="sm" onclick={send} loading={sending} loadingLabel="Sending" disabled={!origin}>Send</Button>
		</div>

		<FieldGroup>
			{#if op.servers.length > 1}
				<Field>
					<FieldLabel>Server</FieldLabel>
					<Select type="single" bind:value={server} items={op.servers.map((s) => ({ value: s.url, label: s.description ?? s.url }))}>
						<SelectTrigger size="sm" aria-label="Server" class="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{#each op.servers as s (s.url)}<SelectItem value={s.url} label={s.description ?? s.url} />{/each}
						</SelectContent>
					</Select>
					<FieldDescription>{resolveServerUrl(server, origin)}</FieldDescription>
				</Field>
			{/if}

			{#if op.security.length > 0}
				<Field>
					<FieldLabel>Authorization</FieldLabel>
					{#if op.security.length > 1}
						<Select
							type="single"
							bind:value={alternative}
							items={op.security.map((alt, i) => ({ value: String(i), label: alt.map((s) => s.name).join(" + ") }))}
						>
							<SelectTrigger size="sm" aria-label="Authorization scheme" class="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								{#each op.security as alt, i (i)}<SelectItem value={String(i)} label={alt.map((s) => s.name).join(" + ")} />{/each}
							</SelectContent>
						</Select>
					{/if}
					{#each auth as scheme (scheme.name)}
						<Input
							type="password"
							size="sm"
							autocomplete="off"
							aria-label={`${scheme.name} credential`}
							placeholder={placeholder(scheme)}
							bind:value={() => playgroundAuth[scheme.name] ?? "", (v) => (playgroundAuth[scheme.name] = v)}
						/>
					{/each}
					<FieldDescription>Kept in memory for this visit and used on every page of this API; never saved.</FieldDescription>
				</Field>
			{/if}

			{#each groups as group (group.location)}
				<div class="flex flex-col gap-3">
					<p class="font-medium text-ink text-sm">{GROUP_LABEL[group.location]}</p>
					{#each group.params as param (param.name)}
						{@const key = paramKey(param.in, param.name)}
						{@const invalid = attempted && param.required && !values[key]}
						<Field orientation="horizontal" class="items-center">
							<FieldLabel class="w-36 shrink-0 flex-col items-start gap-0.5">
								<span class="flex items-center gap-1.5">
									{param.name}
									{#if param.required}<span class="text-warning-strong" aria-label="required">*</span>{/if}
								</span>
								<span class="font-normal text-muted text-xs">{param.schema.type}</span>
							</FieldLabel>
							{#if param.schema.enum}
								<Select type="single" bind:value={values[key]} items={enumItems(param)}>
									<SelectTrigger size="sm" aria-label={param.name} class="w-full"><SelectValue placeholder="Not set" /></SelectTrigger>
									<SelectContent>
										{#each enumItems(param) as item (item.value)}<SelectItem value={item.value} label={item.label} />{/each}
									</SelectContent>
								</Select>
							{:else}
								<Input size="sm" bind:value={values[key]} {invalid} aria-label={param.name} placeholder={literal(param.schema.default) ?? ""} />
							{/if}
						</Field>
					{/each}
				</div>
			{/each}

			{#if content}
				<Field>
					<FieldLabel>Body <span class="font-normal text-muted text-xs">{content.mediaType}</span></FieldLabel>
					<Textarea bind:value={body} rows={8} autoGrow maxRows={20} spellcheck={false} class="font-mono text-xs" aria-label="Request body" />
				</Field>
			{/if}
		</FieldGroup>

		{#if attempted && missing.length > 0}
			<p class="text-destructive-strong text-sm">Fill in {missing.join(", ")} first.</p>
		{/if}

		{#if result && "error" in result}
			<p class="rounded-lg bg-[color-mix(in_oklch,var(--destructive)_10%,transparent)] px-3 py-2 text-destructive-strong text-sm">
				{result.error}
			</p>
		{:else if result}
			<div class="flex flex-col gap-3" aria-live="polite">
				<div class="flex items-center gap-2 text-sm">
					<Badge variant={tone(result.status)} size="sm">{result.status} {result.statusText}</Badge>
					<span class="text-muted text-xs">{result.ms} ms</span>
				</div>
				<Tabs bind:value={resultTab} variant="segment" size="sm">
					<TabsList>
						<TabsTrigger value="body">Body</TabsTrigger>
						<TabsTrigger value="headers">Headers ({result.headers.length})</TabsTrigger>
					</TabsList>
					<TabsContent value="body" class="mt-3">
						{#if result.body}
							<CodeBlock code={result.body} language={result.contentType?.split(";")[0] ?? "text"} maxHeight="28rem" />
						{:else}
							<p class="text-muted text-sm">Empty body.</p>
						{/if}
					</TabsContent>
					<TabsContent value="headers" class="mt-3">
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
			</div>
		{/if}
	</div>
</Panel>
