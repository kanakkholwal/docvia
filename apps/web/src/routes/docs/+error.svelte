<script lang="ts">
import { dev } from "$app/env";
import { page } from "$app/state";
import RequestLog from "#lib/components/site/request-log.svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import { ArrowLeft } from "@lucide/svelte";

const status = $derived(page.status);
const notFound = $derived(status === 404);
const message = $derived(dev ? (page.error?.message ?? "Unknown error") : "An unexpected error occurred.");
</script>

<svelte:head>
	<title>{notFound ? "404 · Not found" : `${status} · Error`} · docvia docs</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="py-4">
	<span class="font-mono text-xs text-brand-ink">{notFound ? "404 · not found" : `${status} · error`}</span>
	<h1 class="mt-3 font-display text-4xl tracking-tighter text-ink md:text-5xl">
		{notFound ? "No page in the docs here." : "This page failed to render."}
	</h1>
	<p class="mt-5 max-w-xl text-lg text-body">
		{notFound
			? "No Markdown file maps to this path. The sidebar and search (Ctrl K) list every page."
			: "Reloading may help. If it keeps happening, an issue on GitHub helps us fix it."}
	</p>
	<div class="mt-8 flex flex-wrap gap-3">
		<Button size="lg" href="/docs">Docs home</Button>
		<Button variant="secondary" size="lg" onclick={() => history.back()}>
			<ArrowLeft />
			Go back
		</Button>
	</div>
	<div class="mt-10 max-w-xl">
		<RequestLog path={page.url.pathname} {status} {message} />
	</div>
</section>
