<script lang="ts">
import { page } from "$app/state";
import { absolute, SITE } from "#lib/seo.ts";
import Seo from "#lib/components/site/seo.svelte";
import PageHeader from "#lib/components/docs/page-header.svelte";
import Pager from "#lib/components/docs/pager.svelte";
import Prose from "#lib/components/docs/prose.svelte";
import { docsRegistry } from "#lib/components/docs/registry.ts";
import Toc from "#lib/components/docs/toc.svelte";
import { Renderer } from "@docvia/core/svelte";
import { Pencil } from "@lucide/svelte";
import { RollText } from "#lib/components/text/roll-text/index.ts";
import type { PageProps } from "./$types";

let { data }: PageProps = $props();

const fm = $derived(data.page.data as Record<string, unknown>);
const title = $derived(String(fm.title ?? "Documentation"));
const description = $derived(
	fm.description ? String(fm.description) : undefined,
);
const eyebrow = $derived(fm.eyebrow ? String(fm.eyebrow) : undefined);
</script>

<Seo
	title="{title} · docvia docs"
	description={description ?? `${title}: docvia documentation.`}
	type="article"
	schema={[
		{
			"@context": "https://schema.org",
			"@type": "TechArticle",
			headline: title,
			description,
			url: absolute(page.url.pathname),
			isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "Docs", item: absolute("/docs") },
				{ "@type": "ListItem", position: 2, name: title, item: absolute(page.url.pathname) },
			],
		},
	]}
/>

<PageHeader {eyebrow} {title} {description} />

<Toc variant="inline" headings={data.page.headings} />

<!-- Generated API pages bring their own layout; Prose's element rules would restyle it. -->
{#if fm.openapi}
	<Renderer nodes={data.page.content} registry={docsRegistry} />
{:else}
	<Prose>
		<Renderer nodes={data.page.content} registry={docsRegistry} />
	</Prose>
{/if}

<div class="mt-12 flex items-center justify-end">
	<a
		href={data.editUrl}
		target="_blank"
		rel="noreferrer"
		class="group/roll inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-(--duration-fast) hover:text-ink"
	>
		<Pencil class="size-3.5" />
		<RollText text="Edit this page on GitHub" groupHover size="sm" class="cursor-[inherit]" />
	</a>
</div>

<Pager prev={data.prev} next={data.next} />
