<script lang="ts">
import type { ApiSchema } from "@docvia/plugin-openapi/source";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.ts";
import SchemaField from "./schema-field.svelte";
import SchemaView from "./schema-view.svelte";

let { schema }: { schema: ApiSchema } = $props();

let option = $state("0");
const label = (s: ApiSchema) => s.ref ?? s.type;
</script>

<div class="divide-y divide-border">
	{#if schema.fields?.length}
		{#each schema.fields as field (field.name)}
			<SchemaField name={field.name} required={field.required} schema={field.schema} />
		{/each}
	{:else if !schema.variants}
		<SchemaField {schema} />
	{/if}

	{#if schema.variants}
		<div class="px-4 py-3">
			<p class="mb-2 text-muted text-xs">{schema.variants.kind === "oneOf" ? "Exactly one of" : "Any of"}</p>
			<Tabs bind:value={option} variant="segment" size="sm">
				<TabsList>
					{#each schema.variants.options as variant, i (i)}
						<TabsTrigger value={String(i)}>{label(variant)}</TabsTrigger>
					{/each}
				</TabsList>
				{#each schema.variants.options as variant, i (i)}
					<TabsContent value={String(i)} class="mt-2">
						<div class="rounded-lg border border-border">
							<SchemaView schema={variant} />
						</div>
					</TabsContent>
				{/each}
			</Tabs>
		</div>
	{/if}
</div>
