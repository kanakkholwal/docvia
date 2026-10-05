<script lang="ts">
import SiteFooter from "#lib/components/site-footer.svelte";
import SiteHeader from "#lib/components/site-header.svelte";
import Wordmark from "#lib/components/site/wordmark.svelte";
import type { Snippet } from "svelte";

let { children }: { children: Snippet } = $props();
</script>

<SiteHeader />

<main id="main" tabindex="-1" class="outline-none">
	{@render children()}
</main>

<SiteFooter />

<div class="mx-auto max-w-page overflow-hidden px-5 sm:px-10 lg:px-16">
	<Wordmark class="-mb-[0.18em]" />
</div>
