<script lang="ts">
import type { ApiContent, ApiOperation, ApiParameter, ApiSecurity } from "@docvia/plugin-openapi/source";
import { operationSections } from "@docvia/plugin-openapi/source";
import { Badge } from "#lib/components/ui/badge/index.ts";
import { CopyButton } from "#lib/components/ui/copy-button/index.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.ts";
import ApiPath from "./api-path.svelte";
import ApiPlayground from "./api-playground.svelte";
import CodeSamples from "./code-samples.svelte";
import Markdown from "./markdown.svelte";
import MethodBadge from "./method-badge.svelte";
import Panel from "./panel.svelte";
import SchemaField from "./schema-field.svelte";
import SchemaView from "./schema-view.svelte";
import SectionHeading from "./section-heading.svelte";

let { operation }: { operation: ApiOperation } = $props();

const sections = $derived(Object.fromEntries(operationSections(operation).map((s) => [s.id, s.text])));
const server = $derived(operation.servers[0]?.url.replace(/\/$/, "") ?? "");
const byLocation = (location: ApiParameter["in"]) => operation.parameters.filter((p) => p.in === location);

// Resets to the first status when client navigation swaps in another operation.
let response = $derived(operation.responses[0]?.status ?? "");

function describeAuth(scheme: ApiSecurity): string {
	if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "basic") return "Basic auth in the Authorization header";
	if (scheme.type === "http")
		return `${scheme.bearerFormat ? `${scheme.bearerFormat} b` : "B"}earer token in the Authorization header`;
	if (scheme.type === "apiKey") return `API key in the ${scheme.paramName} ${scheme.in === "query" ? "query parameter" : scheme.in}`;
	if (scheme.type === "oauth2") return "OAuth 2.0 access token in the Authorization header";
	if (scheme.type === "openIdConnect") return "OpenID Connect token in the Authorization header";
	return "Mutual TLS client certificate";
}

function tone(status: string): string {
	if (status.startsWith("2")) return "bg-success";
	if (status.startsWith("3")) return "bg-info";
	if (status.startsWith("4")) return "bg-warning";
	if (status.startsWith("5")) return "bg-destructive";
	return "bg-muted";
}
</script>

{#snippet contentView(content: ApiContent, title: string)}
	<Panel class="mt-3">
		{#snippet header()}
			<span class="font-medium text-ink">{title}</span>
			<span>{content.mediaType}</span>
		{/snippet}
		{#if content.schema}
			<SchemaView schema={content.schema} />
		{:else}
			<p class="px-4 py-3 text-muted text-sm">No schema.</p>
		{/if}
	</Panel>
	{#if content.examples.length > 0}
		<CodeSamples samples={content.examples} class="mt-3" />
	{/if}
{/snippet}

<div class="flex flex-col">
	<Panel>
		<div class="flex items-center gap-3 px-3 py-2.5">
			<MethodBadge method={operation.method} size="md" />
			<ApiPath path={operation.path} class="flex-1 text-sm" />
			{#if operation.deprecated}<Badge variant="destructive" size="sm">Deprecated</Badge>{/if}
			<CopyButton text={`${server}${operation.path}`} iconOnly label="Copy URL" copiedLabel="URL copied" />
		</div>
		{#if operation.servers.length > 0}
			<div class="flex flex-wrap gap-x-4 gap-y-1 border-border border-t px-3 py-2 text-muted text-xs">
				{#each operation.servers as s (s.url)}
					<span>{s.description ? `${s.description}: ` : ""}{s.url}</span>
				{/each}
			</div>
		{/if}
	</Panel>

	{#if operation.description}
		<Markdown html={operation.description} class="mt-6" />
	{/if}

	{#if operation.samples.length > 0}
		<CodeSamples samples={operation.samples} shared class="mt-6" />
	{/if}

	{#key operation.slug}
		<div class="mt-6"><ApiPlayground {operation} /></div>
	{/key}

	{#if sections.authorization}
		<SectionHeading id="authorization">{sections.authorization}</SectionHeading>
		{#if operation.security.length > 1}
			<p class="mb-3 text-muted text-sm">Any one of these works.</p>
		{/if}
		<div class="flex flex-col gap-3">
			{#each operation.security as alternative, i (i)}
				<Panel>
					<div class="divide-y divide-border">
						{#each alternative as scheme (scheme.name)}
							<div class="flex flex-col gap-1.5 px-4 py-3 text-sm">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-semibold text-ink">{scheme.name}</span>
									<span class="text-muted">{describeAuth(scheme)}</span>
								</div>
								<Markdown html={scheme.description} class="text-sm" />
								{#if scheme.scopes.length > 0}
									<div class="flex flex-wrap items-center gap-1.5 text-muted text-xs">
										<span>Scopes</span>
										{#each scheme.scopes as scope (scope)}<Badge variant="outline" size="sm">{scope}</Badge>{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</Panel>
			{/each}
		</div>
	{/if}

	{#each ["path", "query", "header", "cookie"] as const as location (location)}
		{@const id = `${location}-parameters`}
		{#if sections[id]}
			<SectionHeading {id}>{sections[id]}</SectionHeading>
			<Panel>
				<div class="divide-y divide-border">
					{#each byLocation(location) as param (param.name)}
						<SchemaField
							name={param.name}
							required={param.required}
							schema={{ ...param.schema, description: param.description ?? param.schema.description, deprecated: param.deprecated || param.schema.deprecated }}
						/>
					{/each}
				</div>
			</Panel>
		{/if}
	{/each}

	{#if operation.requestBody}
		<SectionHeading id="request-body">{sections["request-body"]}</SectionHeading>
		<div class="flex items-center gap-2">
			{#if operation.requestBody.required}<Badge variant="warning" size="sm">required</Badge>{/if}
			<Markdown html={operation.requestBody.description} class="text-sm" />
		</div>
		{#each operation.requestBody.contents as content (content.mediaType)}
			{@render contentView(content, "Body")}
		{/each}
	{/if}

	{#if operation.responses.length > 0}
		<SectionHeading id="responses">{sections.responses}</SectionHeading>
		<Tabs value={response} onValueChange={(v) => (response = v)} variant="segment" size="sm">
			<TabsList>
				{#each operation.responses as r (r.status)}
					<TabsTrigger value={r.status}>
						<span class="mr-1.5 size-1.5 rounded-full {tone(r.status)}"></span>{r.status}
					</TabsTrigger>
				{/each}
			</TabsList>
			{#each operation.responses as r (r.status)}
				<TabsContent value={r.status}>
					<Markdown html={r.description} class="text-sm" />
					{#if r.headers.length > 0}
						<Panel class="mt-3">
							{#snippet header()}<span class="font-medium text-ink">Headers</span>{/snippet}
							<div class="divide-y divide-border">
								{#each r.headers as h (h.name)}
									<SchemaField name={h.name} required={h.required} schema={{ ...h.schema, description: h.description ?? h.schema.description }} />
								{/each}
							</div>
						</Panel>
					{/if}
					{#each r.contents as content (content.mediaType)}
						{@render contentView(content, "Response")}
					{/each}
				</TabsContent>
			{/each}
		</Tabs>
	{/if}
</div>
