<script lang="ts">
import { ArrowRight, Check } from "@lucide/svelte";
import { onMount } from "svelte";
import { fade, fly, scale } from "svelte/transition";
import { cubicOut } from "svelte/easing";
import { Button } from "$lib/components/ui/button";

const buildLog = [
	{ label: "parse", detail: "docs/  ·  24 files", duration: "38ms" },
	{ label: "ir", detail: "transform → 312 nodes", duration: "21ms" },
	{ label: "react", detail: "emit .docvia/react", duration: "104ms" },
	{ label: "svelte", detail: "emit .docvia/svelte", duration: "98ms" },
	{ label: "static", detail: "emit .docvia/html", duration: "61ms" },
];

const frameworks = ["React", "Svelte", "Next.js", "Vite", "Astro", "Static"];

let mounted = $state(false);
onMount(() => {
	mounted = true;
});
</script>

<section class="relative overflow-hidden bg-canvas">
	<div
		class="mx-auto grid max-w-7xl gap-12 px-6 pt-20 pb-24 md:px-10 md:pt-28 md:pb-32 lg:grid-cols-12 lg:gap-10"
	>
		<!-- ── Left: editorial copy (7 cols) ────────────────────────── -->
		<div class="flex flex-col justify-center lg:col-span-7">
			{#if mounted}
				<span
					in:fly={{ y: 8, duration: 280, easing: cubicOut, delay: 40 }}
					class="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-[13px] font-medium text-body-strong"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					Open source · self-host anywhere
				</span>

				<h1
					in:fly={{ y: 16, duration: 360, easing: cubicOut, delay: 120 }}
					class="font-display text-[44px] leading-[1.02] text-ink sm:text-5xl md:text-6xl lg:text-[72px]"
					style="letter-spacing: -0.035em;"
				>
					Docs that compile.
					<br />
					Ship them anywhere.
				</h1>

				<p
					in:fly={{ y: 12, duration: 320, easing: cubicOut, delay: 280 }}
					class="mt-8 max-w-xl text-lg leading-[1.55] text-body"
				>
					Markdown in. Typed modules out. Render for React, Svelte, Vite, or
					any framework with an adapter.
				</p>

				<div
					in:fly={{ y: 12, duration: 320, easing: cubicOut, delay: 360 }}
					class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
				>
					<Button size="lg" href="/docs">
						Get started
						<ArrowRight />
					</Button>
					<Button variant="outline" size="lg" href="/#editions">
						Join Team waitlist
					</Button>
				</div>

				<div
					in:fade={{ duration: 360, delay: 480 }}
					class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted"
				>
					<span class="inline-flex items-center gap-1.5">
						<Check class="h-4 w-4 text-check" />
						Open source MIT
					</span>
					<span class="inline-flex items-center gap-1.5">
						<Check class="h-4 w-4 text-check" />
						No vendor lock-in
					</span>
					<span class="inline-flex items-center gap-1.5">
						<Check class="h-4 w-4 text-check" />
						Self-host or BYO cloud
					</span>
				</div>
			{/if}
		</div>

		<!-- ── Right: hero illustration card (5 cols) ────────────────── -->
		<div class="relative lg:col-span-5">
			{#if mounted}
				<div
					in:fly={{ y: 24, duration: 480, easing: cubicOut, delay: 200 }}
					class="relative rounded-xl border border-hairline bg-surface-soft p-6 md:p-8"
				>
					<!-- Build console (product UI fragment) -->
					<div
						class="relative overflow-hidden rounded-lg border border-hairline bg-canvas"
					>
						<!-- Console chrome -->
						<div
							class="flex items-center gap-2 border-b border-hairline bg-surface-card/60 px-4 py-2.5"
						>
							<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-brand"></span>
							<span class="ml-3 font-mono text-[11px] text-muted-soft">
								docvia · build
							</span>
						</div>

						<!-- Build log (staggered reveal) -->
						<div class="space-y-2.5 p-5 font-mono text-[13px]">
							<div
								in:fade={{ duration: 200, delay: 400 }}
								class="text-muted"
							>
								$ docvia build
							</div>
							{#each buildLog as step, i}
								<div
									in:fly={{
										x: -6,
										duration: 280,
										easing: cubicOut,
										delay: 500 + i * 90,
									}}
									class="flex items-center gap-3"
								>
									<Check class="h-3.5 w-3.5 shrink-0 text-check" />
									<span class="w-14 font-semibold text-ink">
										{step.label}
									</span>
									<span class="flex-1 truncate text-body">
										{step.detail}
									</span>
									<span class="text-muted-soft">{step.duration}</span>
								</div>
							{/each}
							<div
								in:fade={{
									duration: 320,
									delay: 500 + buildLog.length * 90,
								}}
								class="border-t border-hairline pt-2.5 text-body-strong"
							>
								<span class="text-check">✓</span> Built 24 pages in
								<span class="font-semibold">412ms</span>
							</div>
						</div>
					</div>

					<!-- Framework targets -->
					<div class="mt-5">
						<div
							class="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
						>
							Render targets
						</div>
						<div class="flex flex-wrap gap-2">
							{#each frameworks as fw, i}
								<span
									in:scale={{
										duration: 280,
										easing: cubicOut,
										start: 0.85,
										delay: 1100 + i * 50,
									}}
									class="rounded-full border border-hairline bg-canvas px-3 py-1 text-[13px] font-medium text-body-strong"
								>
									{fw}
								</span>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
