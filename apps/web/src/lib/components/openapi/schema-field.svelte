<script lang="ts">
import type { ApiSchema } from "@docvia/plugin-openapi/source";
import { Badge } from "#lib/components/ui/badge/index.ts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#lib/components/ui/collapsible/index.ts";
import Markdown from "./markdown.svelte";
import SchemaView from "./schema-view.svelte";

let { name, required = false, schema }: { name?: string; required?: boolean; schema: ApiSchema } =
	$props();

/** The schema whose shape is worth expanding: objects, unions, or arrays and maps of them. */
function expandable(s: ApiSchema): ApiSchema | undefined {
	if (s.circular) return undefined;
	if (s.fields?.length || s.variants) return s;
	if (s.items) return expandable(s.items);
	if (s.additional) return expandable(s.additional);
	return undefined;
}

const nested = $derived(expandable(schema));
const count = $derived(
	nested?.fields?.length
		? `${nested.fields.length} ${nested.fields.length === 1 ? "property" : "properties"}`
		: `${nested?.variants?.options.length ?? 0} options`,
);
const literal = (value: string) => (value.startsWith('"') ? JSON.parse(value) : value);
</script>

<div class="flex flex-col gap-1.5 px-4 py-3">
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
		{#if name}<span class="font-semibold text-ink">{name}</span>{/if}
		<span class="text-muted">{schema.type}</span>
		{#if required}<Badge variant="warning" size="sm">required</Badge>{/if}
		{#if schema.readOnly}<Badge variant="secondary" size="sm">read-only</Badge>{/if}
		{#if schema.writeOnly}<Badge variant="secondary" size="sm">write-only</Badge>{/if}
		{#if schema.deprecated}<Badge variant="destructive" size="sm">deprecated</Badge>{/if}
	</div>

	<Markdown html={schema.description} class="text-sm" />

	{#if schema.enum || schema.default !== undefined || schema.constraints.length > 0}
		<div class="flex flex-wrap items-center gap-1.5 text-muted text-xs">
			{#if schema.enum}
				<span>One of</span>
				{#each schema.enum as value (value)}
					<Badge variant="outline" size="sm">{literal(value)}</Badge>
				{/each}
			{/if}
			{#if schema.default !== undefined}
				<span>Default</span>
				<Badge variant="outline" size="sm">{literal(schema.default)}</Badge>
			{/if}
			{#each schema.constraints as rule (rule)}
				<span class="rounded-md bg-card px-1.5 py-0.5">{rule}</span>
			{/each}
		</div>
	{/if}

	{#if schema.circular}
		<p class="text-muted text-xs">Same shape as {schema.ref ?? "its parent"}, nested again.</p>
	{:else if nested}
		<Collapsible class="mt-1">
			<CollapsibleTrigger class="w-auto px-0 py-0.5 text-muted text-xs">Show {count}</CollapsibleTrigger>
			<CollapsibleContent class="px-0 pb-0">
				<div class="mt-2 rounded-lg border border-border">
					<SchemaView schema={nested} />
				</div>
			</CollapsibleContent>
		</Collapsible>
	{/if}
</div>
