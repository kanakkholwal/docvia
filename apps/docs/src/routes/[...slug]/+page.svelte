<script lang="ts">
import { Renderer } from "@docvia/renderer-svelte";
import PageHeader from "$lib/components/page-header.svelte";
import Prose from "$lib/components/prose.svelte";
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
	<Renderer nodes={data.page.content} />
</Prose>
