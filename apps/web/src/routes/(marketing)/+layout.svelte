<script lang="ts">
import SiteFooter from "$lib/components/site-footer.svelte";
import SiteHeader from "$lib/components/site-header.svelte";
import type { Snippet } from "svelte";

let { children }: { children: Snippet } = $props();
</script>

<SiteHeader />

<main id="main">
	{@render children()}
</main>

<SiteFooter />
