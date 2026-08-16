<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { ArrowRight, Github, MessageCircle, Package, Menu, Sparkles, X } from "@lucide/svelte";
import type { Snippet } from "svelte";
import { onMount } from "svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";
import { version, refreshVersion } from "$lib/version.svelte";
import "../app.css";


let { children }: { children: Snippet } = $props();
let mobileOpen = $state(false);

onMount(refreshVersion);

const navLinks = [
	{ label: "Features", href: "/#features" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Quickstart", href: "/#quickstart" },
	{ label: "Docs", href: "https://docs.docvia.dev?utm_source=docvia.dev&utm_medium=referral&utm_campaign=navbar" },
];
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand"
>
	Skip to content
</a>

<!-- ── Thin announcement strip ──────────────────────────────────────── -->
<div class="border-b border-hairline bg-surface-soft">
	<div
		class="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-6 text-[13px] text-body md:px-10"
	>
		<Sparkles class="h-3.5 w-3.5 shrink-0 text-brand-ink" />
		<span class="hidden sm:inline">
			docvia v{version.current} is in public preview ·
		</span>
		<a
			href="https://github.com/kanakkholwal/docvia"
			class="group inline-flex items-center gap-1 font-medium text-ink underline-offset-4 hover:underline"
		>
			Star it on GitHub
			<ArrowRight
				class="h-3.5 w-3.5 transition-transform duration-(--motion-fast) ease-out group-hover:translate-x-0.5"
			/>
		</a>
	</div>
</div>

<!-- ── Full-width top bar (vite-style) ──────────────────────────────── -->
<header
	class="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md"
>
	<div
		class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 md:px-10"
	>
		<!-- Left: brand + version + nav -->
		<div class="flex items-center gap-6">
			<Brand size="sm" />
			<span
				class="hidden h-6 items-center gap-1.5 rounded-full bg-surface-card pl-2 pr-2.5 text-[12px] font-medium tracking-[0.01em] text-body sm:inline-flex"
			>
				<span class="relative flex h-1.5 w-1.5">
					<span
						class="absolute inset-0 animate-ping rounded-full bg-brand opacity-60"
					></span>
					<span class="relative h-1.5 w-1.5 rounded-full bg-brand"></span>
				</span>
				v{version.current}
			</span>
			<nav class="hidden items-center gap-1 md:flex">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-md px-2.5 py-1.5 text-[15px] font-medium text-body transition-colors duration-(--motion-fast) ease-out hover:bg-surface-card hover:text-ink"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Right: actions -->
		<div class="flex items-center gap-1.5">
			<a
				href="https://github.com/kanakkholwal/docvia"
				aria-label="GitHub"
				class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md text-body transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:bg-surface-card hover:text-ink"
			>
				<Github class="h-4 w-4" />
			</a>
			<ThemeToggle />
			<Button
				variant="primary"
				size="sm"
				href="https://docs.docvia.dev?utm_source=docvia.dev&utm_medium=referral&utm_campaign=navbar"
				class="hidden sm:inline-flex"
			>
				Get started
			</Button>
			<button
				aria-label="Toggle menu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
				class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md text-body transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:bg-surface-card hover:text-ink md:hidden"
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
			class="border-t border-hairline bg-canvas px-6 py-3 md:hidden"
		>
			<nav class="flex flex-col gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						onclick={() => (mobileOpen = false)}
						class="rounded-md px-3 py-2.5 text-[15px] font-medium text-body hover:bg-surface-card hover:text-ink"
					>
						{link.label}
					</a>
				{/each}
				<a
					href="https://docs.docvia.dev"
					class="mt-1 inline-flex items-center justify-center rounded-md bg-brand px-3 py-2.5 text-[15px] font-medium text-on-brand"
				>
					Get started
				</a>
			</nav>
		</div>
	{/if}
</header>

<main id="main">
	{@render children()}
</main>

<!-- ── Footer ──────────────────────────────────────────────────────── -->
<footer class="relative border-t border-hairline bg-surface-soft pt-20 md:pt-24">
	<div class="mx-auto max-w-7xl px-6 md:px-10">
		<!-- Brand + tagline + social (vite-style: no newsletter card) -->
		<div class="flex flex-col gap-5 border-b border-hairline pb-12">
			<Brand size="lg" />
			<p class="max-w-md text-[16px] leading-[1.6] text-body">
				The build-time documentation compiler. Open source,
				framework-agnostic, self-host anywhere.
			</p>
			<div class="flex items-center gap-2 pt-1">
				<a
					href="https://github.com/kanakkholwal/docvia"
					aria-label="GitHub"
					class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md border border-hairline text-body transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:border-hairline-strong hover:bg-surface-card hover:text-ink"
				>
					<Github class="h-4 w-4" />
				</a>
				<a
					href="https://www.npmjs.com/org/docvia"
					aria-label="npm"
					class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md border border-hairline text-body transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:border-hairline-strong hover:bg-surface-card hover:text-ink"
				>
					<Package class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/kanakkholwal/docvia/discussions"
					aria-label="Discussions"
					class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md border border-hairline text-body transition-[color,background-color,border-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:border-hairline-strong hover:bg-surface-card hover:text-ink"
				>
					<MessageCircle class="h-4 w-4" />
				</a>
			</div>
		</div>

		<!-- Mid: link columns -->
		<div
			class="grid gap-10 py-12 md:grid-cols-3 md:gap-8"
		>
			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4 class="label-meta">
						Product
					</h4>
				</div>
				<ul class="space-y-2.5 text-[15px]">
					<li><a href="/#features" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Features</a></li>
					<li><a href="/#how-it-works" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">How it works</a></li>
					<li><a href="/#quickstart" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Quickstart</a></li>
					<li><a href="/#faq" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">FAQ</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4 class="label-meta">
						Resources
					</h4>
				</div>
				<ul class="space-y-2.5 text-[15px]">
					<li><a href="https://docs.docvia.dev" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Documentation</a></li>
					<li><a href="https://docs.docvia.dev/getting-started" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Getting started</a></li>
					<li><a href="https://docs.docvia.dev/guide/configuration" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Config reference</a></li>
					<li><a href="https://docs.docvia.dev/packages/plugin-openapi" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">OpenAPI plugin</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/releases" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Changelog</a></li>
				</ul>
			</div>

			<div>
				<div class="mb-4 flex items-center gap-2">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<h4 class="label-meta">
						Community
					</h4>
				</div>
				<ul class="space-y-2.5 text-[15px]">
					<li><a href="https://github.com/kanakkholwal/docvia" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">GitHub</a></li>
					<li><a href="https://www.npmjs.com/org/docvia" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">npm</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/issues" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Report an issue</a></li>
					<li><a href="https://github.com/kanakkholwal/docvia/discussions" class="text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink">Discussions</a></li>
				</ul>
			</div>
		</div>

		<!-- Bottom row: copyright + version + made-with -->
		<div
			class="flex flex-col items-start gap-3 border-t border-hairline pt-6 pb-10 text-[13px] text-muted md:flex-row md:items-center md:justify-between"
		>
			<div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
				<span>© {new Date().getFullYear()} docvia · Released under the MIT licence.</span>
			</div>
			<div class="flex items-center gap-3">
				<span class="inline-flex items-center gap-1.5">
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					<span class="font-mono">v{version.current} preview</span>
				</span>
				<span class="text-muted-soft">·</span>
				<span>Built with docvia</span>
			</div>
		</div>
	</div>


</footer>
