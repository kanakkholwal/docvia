<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { ArrowRight, Github, Menu, Sparkles, X } from "@lucide/svelte";
import type { Snippet } from "svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";
import "../app.css";


let { children }: { children: Snippet } = $props();
let mobileOpen = $state(false);

const navLinks = [
	{ label: "Features", href: "/#features" },
	{ label: "Compare", href: "/#comparison" },
	{ label: "Editions", href: "/#editions" },
	{ label: "Docs", href: "https://docs.docvia.dev?utm_source=docvia.dev&utm_medium=referral&utm_campaign=navbar" },
];
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-on-primary"
>
	Skip to content
</a>

<!-- ── Top announcement strip — scrolls away with the page ─────────── -->
<div class="bg-surface-card">
	<div
		class="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-[12.5px] text-body-strong md:px-6"
	>
		<Sparkles class="h-3.5 w-3.5 text-brand-ink" />
		<span class="hidden sm:inline">
			docvia is in public preview ·
		</span>
		<a
			href="/#editions"
			class="inline-flex items-center gap-1 font-semibold text-ink underline-offset-4 hover:underline"
		>
			Join the Team waitlist
			<ArrowRight class="h-3.5 w-3.5" />
		</a>
	</div>
</div>

<!-- ── Floating pill nav ───────────────────────────────────────────── -->
<header class="sticky top-3 z-40 px-3 md:top-4 md:px-6">
	<div class="mx-auto max-w-6xl">
		<div
			class="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-full border border-hairline bg-canvas/92 px-3 shadow-[0_4px_24px_-12px_rgba(10,10,10,0.18)] backdrop-blur-md md:pl-4"
		>
			<!-- Left: brand + status -->
			<div class="flex items-center gap-3">
				<Brand size="sm" />
				<span
					class="hidden h-6 items-center gap-1.5 rounded-full bg-surface-card pl-2 pr-2.5 text-[11px] font-semibold uppercase tracking-widest text-body-strong sm:inline-flex"
				>
					<span class="relative flex h-1.5 w-1.5">
						<span
							class="absolute inset-0 animate-ping rounded-full bg-brand opacity-60"
						></span>
						<span class="relative h-1.5 w-1.5 rounded-full bg-brand"></span>
					</span>
					v0.1
				</span>
			</div>

			<!-- Center: nav -->
			<nav class="hidden items-center justify-center gap-0.5 md:flex">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-full px-3 py-1.5 text-[14px] font-medium text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Right: actions -->
			<div class="flex items-center justify-end gap-1">
				<a
					href="https://github.com/kanakkholwal/docvia"
					aria-label="GitHub"
					class="hidden h-9 w-9 items-center justify-center rounded-full text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink md:inline-flex"
				>
					<Github class="h-4 w-4" />
				</a>
				<div class="hidden md:block">
					<ThemeToggle />
				</div>
				<Button
					variant="primary"
					size="sm"
					href="https://docs.docvia.dev?utm_source=docvia.dev&utm_medium=referral&utm_campaign=navbar"
					class="hidden h-9 rounded-full sm:inline-flex"
				>
					Get started
				</Button>
				<button
					aria-label="Toggle menu"
					aria-expanded={mobileOpen}
					onclick={() => (mobileOpen = !mobileOpen)}
					class="inline-flex h-10 w-10 items-center justify-center rounded-full text-body transition-colors hover:bg-surface-card hover:text-ink md:hidden"
				>
					{#if mobileOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		{#if mobileOpen}
			<div
				transition:slide={{ duration: 240, easing: cubicOut }}
				class="mt-2 rounded-xl border border-hairline bg-canvas p-2 shadow-[0_4px_24px_-12px_rgba(10,10,10,0.18)] md:hidden"
			>
				<nav class="flex flex-col gap-1">
					{#each navLinks as link}
						<a
							href={link.href}
							onclick={() => (mobileOpen = false)}
							class="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-surface-card hover:text-ink"
						>
							{link.label}
						</a>
					{/each}
					<a
						href="https://github.com/kanakkholwal/docvia"
						class="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-surface-card hover:text-ink"
					>
						GitHub
					</a>
					<div class="flex items-center justify-between rounded-md px-3 py-2">
						<span class="text-sm font-medium text-body">Theme</span>
						<ThemeToggle />
					</div>
				</nav>
			</div>
		{/if}
	</div>
</header>

<main id="main" class="pt-2">
	{@render children()}
</main>

<!-- ── Footer ──────────────────────────────────────────────────────── -->
<footer class="relative bg-surface-soft pt-20 md:pt-24">
	<div class="mx-auto max-w-7xl px-6 md:px-10">
		<!-- Top band: tagline + brand -->
		<div
			class="grid gap-10 border-b border-hairline/70 pb-12 md:grid-cols-[1.4fr_1fr] md:gap-16"
		>
			<div class="flex flex-col gap-6">
				<Brand size="lg" />
				<h3
					class="font-display text-3xl text-ink md:text-4xl lg:text-[44px] lg:leading-[1.05]"
					style="letter-spacing: -0.03em;"
				>
					Compile your docs.
					<br />
					Ship them anywhere.
				</h3>
				<p class="max-w-md text-[15px] leading-[1.55] text-body">
					The build-time documentation compiler. Open source, framework-agnostic,
					self-host or BYO cloud.
				</p>
			</div>

			<!-- Stay in the loop card -->
			<div
				class="flex flex-col gap-4 rounded-xl border border-hairline bg-surface-card p-6 md:gap-5"
			>
				<div class="flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<span
						class="text-[11px] font-semibold uppercase tracking-widest text-muted"
					>
						Stay in the loop
					</span>
				</div>
				<p class="text-[14px] leading-[1.55] text-body">
					Get notified when Team and Enterprise editions go live — and when v1.0 ships.
				</p>
				<a
					href="mailto:docviajs@gmail.com?subject=Subscribe"
					class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-[13px] font-semibold text-on-primary transition-colors hover:bg-body-strong"
				>
					Join the list
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</div>
		</div>

		<!-- Mid: link columns -->
		<div
			class="grid gap-10 py-12 md:grid-cols-4 md:gap-8"
		>
			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4
						class="text-[11px] font-semibold uppercase tracking-widest text-muted"
					>
						Product
					</h4>
				</div>
				<ul class="space-y-2 text-[14px]">
					<li><a href="/#features" class="text-body hover:text-ink">Features</a></li>
					<li><a href="/#comparison" class="text-body hover:text-ink">Compare</a></li>
					<li><a href="/#editions" class="text-body hover:text-ink">Editions</a></li>
					<li><a href="/#quickstart" class="text-body hover:text-ink">Quickstart</a></li>
					<li><a href="/#faq" class="text-body hover:text-ink">FAQ</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4
						class="text-[11px] font-semibold uppercase tracking-widest text-muted"
					>
						Resources
					</h4>
				</div>
				<ul class="space-y-2 text-[14px]">
					<li><a href="https://docs.docvia.dev" class="text-body hover:text-ink">Documentation</a></li>
					<li><a href="https://docs.docvia.dev/getting-started" class="text-body hover:text-ink">Getting started</a></li>
					<li><a href="https://docs.docvia.dev/config" class="text-body hover:text-ink">Config reference</a></li>
					<li><a href="https://docs.docvia.dev/plugins/openapi" class="text-body hover:text-ink">OpenAPI plugin</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/releases" class="text-body hover:text-ink">Changelog</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4
						class="text-[11px] font-semibold uppercase tracking-widest text-muted"
					>
						Community
					</h4>
				</div>
				<ul class="space-y-2 text-[14px]">
					<li><a href="https://github.com/kanakkholwal/docvia" class="text-body hover:text-ink">GitHub</a></li>
					<li><a href="https://www.npmjs.com/org/docvia" class="text-body hover:text-ink">npm</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/issues" class="text-body hover:text-ink">Report an issue</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/discussions" class="text-body hover:text-ink">Discussions</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4
						class="text-[11px] font-semibold uppercase tracking-widest text-muted"
					>
						Legal
					</h4>
				</div>
				<ul class="space-y-2 text-[14px]">
					<li><a href="https://github.com/kanakkholwal/docvia/blob/main/LICENSE" class="text-body hover:text-ink">MIT licence</a></li>
					<li><a href="/privacy" class="text-body hover:text-ink">Privacy</a></li>
					<li><a href="/terms" class="text-body hover:text-ink">Terms</a></li>
					<li><a href="/security" class="text-body hover:text-ink">Security</a></li>
				</ul>
			</div>
		</div>

		<!-- Bottom row: copyright + version + made-with -->
		<div
			class="flex flex-col items-start gap-3 border-t border-hairline/70 pt-6 pb-10 text-[12.5px] text-muted md:flex-row md:items-center md:justify-between"
		>
			<div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
				<span>© {new Date().getFullYear()} docvia · Released under the MIT licence.</span>
			</div>
			<div class="flex items-center gap-3">
				<span class="inline-flex items-center gap-1.5">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<span class="font-mono">v0.1 preview</span>
				</span>
				<span class="text-muted-soft">·</span>
				<span>Built with docvia</span>
			</div>
		</div>
	</div>


</footer>
