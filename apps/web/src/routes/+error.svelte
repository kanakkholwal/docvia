<script lang="ts">
import { page } from "$app/state";
import { ArrowRight, Home, Search } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

const status = $derived(page.status);
const isNotFound = $derived(status === 404);
const headline = $derived(
	isNotFound ? "This page didn't compile." : "Something tripped the build.",
);
const tagline = $derived(
	isNotFound
		? "There's no source file at this path. The page you were after may have moved, been renamed, or never existed."
		: "An unexpected error reached the page renderer. The team has been notified.",
);
const errorMessage = $derived(page.error?.message ?? "Unknown error");
</script>

<svelte:head>
	<title>{isNotFound ? "404 · Not found" : `${status} · Error`} · docvia</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="relative overflow-hidden bg-canvas">
	<div
		class="mx-auto grid min-h-[calc(100vh-8rem)] max-w-page items-center gap-12 px-5 py-14 sm:px-10 md:py-24 lg:grid-cols-12 lg:gap-10"
	>
		<!-- Left: editorial copy -->
		<div class="flex flex-col justify-center lg:col-span-7">
			<span
				class="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-[13px] font-medium text-body-strong"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
				{isNotFound ? "404 · not found" : `${status} · build error`}
			</span>

			<h1
				class="font-display text-[40px] leading-[1.12] tracking-tighter text-ink sm:text-5xl md:text-[60px]"
			>
				{headline}
			</h1>

			<p class="mt-8 max-w-xl text-[18px] leading-7 text-body">
				{tagline}
			</p>

			<div class="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
				<Button href="/">
					<Home />
					Back to home
				</Button>
				<Button variant="outline" href="https://docs.docvia.dev">
					Read the docs
					<ArrowRight />
				</Button>
			</div>

			{#if !isNotFound && page.error}
				<div
					class="mt-8 max-w-xl rounded-md border border-hairline bg-surface-card p-4 font-mono text-[12px] text-body"
				>
					<div class="label-meta mb-1">Error · {status}</div>
					<div class="wrap-break-word text-body-strong">{errorMessage}</div>
				</div>
			{/if}
		</div>

		<!-- Right: stylised status illustration card -->
		<div class="relative lg:col-span-5">
			<div class="relative rounded-lg border border-hairline bg-surface-soft p-8 md:p-10">
				<div
					class="font-display text-[128px] leading-[0.95] text-brand-ink md:text-[160px]"
					style="letter-spacing: -0.06em;"
				>
					{status}
				</div>

				<!-- Mini console showing the failed resolve -->
				<div class="mt-6 overflow-hidden rounded-md border border-hairline bg-canvas">
					<div
						class="flex items-center gap-2 border-b border-hairline bg-surface-card px-4 py-2.5"
					>
						<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-brand"></span>
						<span class="ml-3 font-mono text-[11px] text-muted">
							docvia · resolve
						</span>
					</div>
					<div class="space-y-2 p-4 font-mono text-[12.5px]">
						<div class="text-muted">$ docvia resolve {page.url.pathname}</div>
						<div class="flex items-center gap-2 text-body-strong">
							<Search class="h-3.5 w-3.5 text-brand-ink" />
							<span class="text-ink">No matching source file</span>
						</div>
						<div class="text-muted">Try a different path or report it.</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
