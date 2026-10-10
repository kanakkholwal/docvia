<script lang="ts">
import type { ApiExample } from "@docvia/plugin-openapi/source";
import { onMount } from "svelte";
import { CodeBlock } from "#lib/components/ui/code-block/index.ts";
import { Tabs, TabsList, TabsTrigger } from "#lib/components/ui/tabs/index.ts";
import { chooseSampleLanguage, restoreSampleLanguage, sampleLanguage } from "./sample-language.svelte.ts";

type Sample = ApiExample & { id?: string };

// `shared` ties the choice to the reader's language preference; examples keep their own state.
let { samples, shared = false, class: className }: { samples: readonly Sample[]; shared?: boolean; class?: string } =
	$props();

const keyOf = (s: Sample, i: number) => s.id ?? String(i);
let local = $state("0");
onMount(() => {
	if (shared) restoreSampleLanguage();
});

const selected = $derived.by(() => {
	const wanted = shared ? sampleLanguage.id : local;
	return samples.find((s, i) => keyOf(s, i) === wanted) ?? samples[0];
});
const value = $derived(selected ? keyOf(selected, samples.indexOf(selected)) : "0");

function select(next: string) {
	if (shared) chooseSampleLanguage(next);
	else local = next;
}
</script>

{#if selected}
	<CodeBlock code={selected.code} html={selected.html} language={selected.label} class={className}>
		{#snippet header()}
			{#if samples.length > 1}
				<Tabs value={value} onValueChange={select} variant="soft" size="sm">
					<TabsList>
						{#each samples as sample, i (keyOf(sample, i))}
							<TabsTrigger value={keyOf(sample, i)}>{sample.label}</TabsTrigger>
						{/each}
					</TabsList>
				</Tabs>
			{:else}
				<span class="px-1 font-medium text-muted text-xs">{selected.label}</span>
			{/if}
		{/snippet}
	</CodeBlock>
{/if}
