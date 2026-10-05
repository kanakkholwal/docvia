<script lang="ts">
import { page } from "$app/state";
import RequestLog from "#lib/components/site/request-log.svelte";
import Wordmark from "#lib/components/site/wordmark.svelte";
import SiteFooter from "#lib/components/site-footer.svelte";
import SiteHeader from "#lib/components/site-header.svelte";
import { Button } from "#lib/components/ui/button/index.ts";
import { ArrowRight } from "@lucide/svelte";

const status = $derived(page.status);
const notFound = $derived(status === 404);
// SvelteKit replaces unexpected error messages with "Internal Error" in production.
const message = $derived(page.error?.message ?? "Unknown error");
</script>

<svelte:head>
	<title>{notFound ? "404 · Not found" : `${status} · Error`} · docvia</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader />

<main id="main" tabindex="-1" class="mx-auto max-w-page px-5 pt-14 outline-none sm:px-10 sm:pt-20 lg:px-16">
	<div class="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
		<div class="flex flex-col max-lg:items-center max-lg:text-center">
			<span class="rise font-mono text-xs text-brand-ink">{notFound ? "404 · not found" : `${status} · error`}</span>
			<h1 class="rise mt-5 font-display text-5xl leading-[1.05] tracking-tighter text-ink sm:text-6xl" style="--i: 1">
				{notFound ? "Nothing compiled" : "This page broke"}
				<span class="block font-pixel tracking-normal text-brand-ink">{notFound ? "at this path." : "while rendering."}</span>
			</h1>
			<p class="rise mt-6 max-w-md text-lg text-body" style="--i: 2">
				{notFound
					? "There is no page here. It may have moved, or the link has a typo."
					: "Something went wrong on our side. Reloading may help; if it keeps happening, an issue on GitHub helps us fix it."}
			</p>
			<div class="rise mt-8 flex flex-wrap gap-3 max-lg:justify-center" style="--i: 3">
				<Button href="/" size="lg" class="group/roll">
					Back to home
					<ArrowRight class="transition-transform duration-(--duration-fast) group-hover/roll:translate-x-0.5" />
				</Button>
				<Button
					href={notFound ? "/docs/getting-started" : "https://github.com/kanakkholwal/docvia/issues"}
					variant="secondary"
					size="lg"
				>
					{notFound ? "Read the docs" : "Report an issue"}
				</Button>
			</div>
		</div>
		<div class="rise min-w-0" style="--i: 2">
			<RequestLog path={page.url.pathname} {status} {message} />
		</div>
	</div>

	<div class="mt-20 overflow-hidden border-t border-dashed border-hairline-strong pt-10">
		<Wordmark text={String(status)} />
	</div>
</main>

<SiteFooter />
