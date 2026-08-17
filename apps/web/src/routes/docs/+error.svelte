<script lang="ts">
import { dev } from "$app/environment";
import { page } from "$app/state";
import { Button } from "$lib/components/ui/button";
import { ArrowLeft, Home, Search } from "@lucide/svelte";

const status = $derived(page.status);
const isNotFound = $derived(status === 404);
const headline = $derived(
	isNotFound ? "Page not in the source." : "Something tripped the page.",
);
const tagline = $derived(
	isNotFound
		? "There's no Markdown file mapped to this path. Try the sidebar, the docs home page, or search."
		: "An unexpected error reached the page renderer. The team has been notified.",
);
const errorMessage = $derived(
	dev ? (page.error?.message ?? "Unknown error") : "An unexpected error occurred.",
);
</script>

<svelte:head>
	<title>{isNotFound ? "404 · Not found" : `${status} · Error`} · docvia docs</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="py-10">
	<span
		class="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-[13px] font-medium text-body-strong"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
		{isNotFound ? "404 · not found" : `${status} · error`}
	</span>

	<h1 class="font-display text-4xl text-ink md:text-5xl" style="letter-spacing: -0.035em;">
		{headline}
	</h1>

	<p class="mt-6 max-w-xl text-lg leading-[1.55] text-body">{tagline}</p>

	<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
		<Button size="lg" href="/docs">
			<Home />
			Docs home
		</Button>
		<Button variant="outline" size="lg" onclick={() => history.back()}>
			<ArrowLeft />
			Go back
		</Button>
	</div>

	<div class="mt-10 max-w-xl overflow-hidden rounded-lg border border-hairline bg-canvas">
		<div class="flex items-center gap-2 border-b border-hairline bg-surface-card/60 px-4 py-2.5">
			<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
			<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
			<span class="h-2.5 w-2.5 rounded-full bg-brand"></span>
			<span class="ml-3 font-mono text-[11px] text-muted-soft">docvia · resolve</span>
		</div>
		<div class="space-y-2 p-4 font-mono text-[12.5px]">
			<div class="text-muted">$ docvia resolve {page.url.pathname}</div>
			<div class="flex items-center gap-2 text-body-strong">
				<Search class="h-3.5 w-3.5 text-brand-ink" />
				<span class="text-ink">
					{isNotFound ? "No matching source file" : errorMessage}
				</span>
			</div>
		</div>
	</div>
</section>
