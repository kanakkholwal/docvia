<script lang="ts">
import { page } from "$app/state";
import { ArrowRight, Home, Search } from "@lucide/svelte";
import { onMount } from "svelte";
import { fade, fly, scale } from "svelte/transition";
import { cubicOut } from "svelte/easing";
import { Button } from "$lib/components/ui/button";

let mounted = $state(false);
onMount(() => {
	mounted = true;
});

const status = $derived(page.status);
const isNotFound = $derived(status === 404);
const headline = $derived(
	isNotFound
		? "This page didn't compile."
		: "Something tripped the build.",
);
const tagline = $derived(
	isNotFound
		? "There's no source file at this path — yet. The page you were after may have moved, been renamed, or never existed."
		: "An unexpected error reached the page renderer. The team has been notified.",
);
const errorMessage = $derived(page.error?.message ?? "Unknown error");
</script>

<svelte:head>
	<title>{isNotFound ? "404 · Not found" : `${status} · Error`} — docvia</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="relative overflow-hidden bg-canvas">
	<div
		class="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 px-6 py-20 md:px-10 md:py-24 lg:grid-cols-12 lg:gap-10"
	>
		<!-- Left: editorial copy -->
		<div class="flex flex-col justify-center lg:col-span-7">
			{#if mounted}
				<span
					in:fly={{ y: 8, duration: 280, easing: cubicOut, delay: 40 }}
					class="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-[13px] font-medium text-body-strong"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-brand-coral"></span>
					{isNotFound ? "404 · not found" : `${status} · build error`}
				</span>

				<h1
					in:fly={{ y: 16, duration: 360, easing: cubicOut, delay: 120 }}
					class="font-display text-[44px] leading-[1.02] text-ink sm:text-5xl md:text-6xl lg:text-[72px]"
					style="letter-spacing: -0.035em;"
				>
					{headline}
				</h1>

				<p
					in:fly={{ y: 12, duration: 320, easing: cubicOut, delay: 260 }}
					class="mt-8 max-w-xl text-lg leading-[1.55] text-body"
				>
					{tagline}
				</p>

				<div
					in:fly={{ y: 12, duration: 320, easing: cubicOut, delay: 340 }}
					class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
				>
					<Button size="lg" href="/">
						<Home />
						Back to home
					</Button>
					<Button variant="outline" size="lg" href="/docs">
						Read the docs
						<ArrowRight />
					</Button>
				</div>

				{#if !isNotFound && page.error}
					<div
						in:fade={{ duration: 320, delay: 460 }}
						class="mt-8 max-w-xl rounded-lg border border-hairline bg-surface-card p-4 font-mono text-[12px] text-body"
					>
						<div
							class="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted"
						>
							Error · {status}
						</div>
						<div class="break-words text-body-strong">{errorMessage}</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Right: stylised 404 illustration card -->
		<div class="relative lg:col-span-5">
			{#if mounted}
				<div
					in:fly={{ y: 24, duration: 480, easing: cubicOut, delay: 200 }}
					class="relative rounded-xl bg-surface-soft p-8 md:p-10"
				>
					<!-- Floating brand-color shapes -->
					<div
						aria-hidden="true"
						in:scale={{ duration: 480, delay: 520, start: 0.6 }}
						class="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-brand-peach"
					></div>
					<div
						aria-hidden="true"
						in:scale={{ duration: 480, delay: 640, start: 0.6 }}
						class="pointer-events-none absolute -bottom-3 -left-3 h-12 w-12 rounded-full bg-brand-mint"
					></div>

					<!-- Big status numeral -->
					<div class="relative">
						<div
							class="font-display text-[128px] leading-[0.95] text-ink md:text-[160px]"
							style="letter-spacing: -0.06em;"
						>
							{status}
						</div>

						<!-- Mini console showing the failed resolve -->
						<div
							class="mt-6 overflow-hidden rounded-lg border border-hairline bg-canvas"
						>
							<div
								class="flex items-center gap-2 border-b border-hairline bg-surface-card/60 px-4 py-2.5"
							>
								<span class="h-2.5 w-2.5 rounded-full bg-brand-coral/70"></span>
								<span class="h-2.5 w-2.5 rounded-full bg-brand-ochre/70"></span>
								<span class="h-2.5 w-2.5 rounded-full bg-brand-mint/80"></span>
								<span class="ml-3 font-mono text-[11px] text-muted-soft">
									docvia · resolve
								</span>
							</div>
							<div class="space-y-2 p-4 font-mono text-[12.5px]">
								<div class="text-muted">$ docvia resolve {page.url.pathname}</div>
								<div class="flex items-center gap-2 text-body-strong">
									<Search class="h-3.5 w-3.5 text-brand-coral" />
									<span class="text-ink">No matching source file</span>
								</div>
								<div class="text-muted">Try a different path or report it.</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
