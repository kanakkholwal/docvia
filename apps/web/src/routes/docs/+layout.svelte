<script lang="ts">
import { page } from "$app/state";
import Sidebar from "#lib/components/docs/sidebar.svelte";
import Toc from "#lib/components/docs/toc.svelte";
import SiteFooter from "#lib/components/site-footer.svelte";
import SiteHeader from "#lib/components/site-header.svelte";
import type { LayoutProps } from "./$types";

let { children, data }: LayoutProps = $props();

// The current page's headings (from the [...slug] server load) feed the TOC.
const headings = $derived(
	(page.data.page as { headings?: { depth: number; text: string; id: string }[] } | undefined)
		?.headings ?? [],
);
</script>

<SiteHeader>
	{#snippet mobileNav()}
		<Sidebar tree={data.tree} mobile />
	{/snippet}
</SiteHeader>

<div class="mx-auto flex max-w-page px-5 sm:px-10 lg:px-16">
	<aside class="hidden w-60 shrink-0 border-r border-dashed border-hairline-strong lg:block">
		<Sidebar tree={data.tree} />
	</aside>

	<main id="main" tabindex="-1" class="min-w-0 outline-none flex-1 px-0 py-10 md:px-10">
		<div class="mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>

	<aside class="hidden w-56 shrink-0 border-l border-dashed border-hairline-strong xl:block">
		<div class="sticky top-16 py-10 pl-6">
			<Toc {headings} />
		</div>
	</aside>
</div>

<SiteFooter />
