<script lang="ts">
import PageHeader from "$lib/components/docs/page-header.svelte";
import Pager from "$lib/components/docs/pager.svelte";
import Prose from "$lib/components/docs/prose.svelte";
import { docsRegistry } from "$lib/components/docs/registry";
import { Renderer } from "@docvia/renderer-svelte";
import { Pencil } from "@lucide/svelte";
import type { PageProps } from "./$types";

let { data }: PageProps = $props();

const fm = $derived(data.page.data as Record<string, unknown>);
const title = $derived(String(fm.title ?? "Documentation"));
const description = $derived(
	fm.description ? String(fm.description) : undefined,
);
const eyebrow = $derived(fm.eyebrow ? String(fm.eyebrow) : undefined);
</script>

<svelte:head>
	<title>{title} · docvia</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
</svelte:head>

<PageHeader {eyebrow} {title} {description} />

<Prose>
	<Renderer nodes={data.page.content} registry={docsRegistry} />
</Prose>

<div class="mt-12 flex items-center justify-end">
	<a
		href={data.editUrl}
		target="_blank"
		rel="noreferrer"
		class="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors duration-(--motion-fast) hover:text-ink"
	>
		<Pencil class="h-3.5 w-3.5" />
		Edit this page on GitHub
	</a>
</div>

<Pager prev={data.prev} next={data.next} />
