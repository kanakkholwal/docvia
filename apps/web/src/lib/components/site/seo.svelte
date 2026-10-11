<script lang="ts">
import { page } from "$app/state";
import { absolute, jsonLd, SITE } from "#lib/seo.ts";

let {
	title,
	description = SITE.description,
	type = "website",
	image = SITE.image,
	noindex = false,
	schema,
}: {
	/** The full document title. */
	title: string;
	description?: string;
	type?: "website" | "article";
	image?: string;
	noindex?: boolean;
	/** Structured data, emitted as JSON-LD. */
	schema?: unknown;
} = $props();

// Trailing slashes and query strings would split ranking across duplicate URLs.
const canonical = $derived(absolute(page.url.pathname.replace(/(.)\/$/, "$1")));
const imageUrl = $derived(absolute(image));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	{#if schema}{@html jsonLd(schema)}{/if}
</svelte:head>
