<script lang="ts">
import "../app.css";
import Brand from "$lib/components/brand.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import { Github, Menu, X } from "@lucide/svelte";
import type { Snippet } from "svelte";

let { children }: { children: Snippet } = $props();
let mobileOpen = $state(false);

const navLinks = [
	{ label: "Features", href: "/#features" },
	{ label: "Use cases", href: "/#use-cases" },
	{ label: "Editions", href: "/#editions" },
	{ label: "Docs", href: "/docs" },
];
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
>
	Skip to content
</a>

<header
	class="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md"
>
	<div
		class="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-6 px-6 md:px-10"
	>
		<div class="flex items-center gap-8">
			<Brand />
			<nav class="hidden items-center gap-1 md:flex">
				{#each navLinks as link}
					<Button variant="ghost" size="sm" href={link.href}>
						{link.label}
					</Button>
				{/each}
			</nav>
		</div>
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				href="https://github.com/kanakkholwal/docvia"
				aria-label="GitHub"
				class="hidden md:inline-flex"
			>
				<Github />
			</Button>
			<ThemeToggle />
			<Button variant="primary" size="sm" href="/docs" class="hidden sm:inline-flex">
				Get started
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="md:hidden"
				aria-label="Toggle menu"
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				{#if mobileOpen}
					<X />
				{:else}
					<Menu />
				{/if}
			</Button>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-border/60 bg-bg md:hidden">
			<nav class="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
				{#each navLinks as link}
					<a
						href={link.href}
						onclick={() => (mobileOpen = false)}
						class="rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
					>
						{link.label}
					</a>
				{/each}
				<a
					href="https://github.com/kanakkholwal/docvia"
					class="rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
				>
					GitHub
				</a>
			</nav>
		</div>
	{/if}
</header>

<main id="main">
	{@render children()}
</main>

<footer class="border-t border-border/60 bg-bg-subtle/40">
	<div
		class="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10"
	>
		<div class="space-y-4">
			<Brand />
			<p class="max-w-xs text-sm leading-relaxed text-fg-muted">
				A build-time documentation compiler for React, Svelte, and any
				framework with a renderer adapter.
			</p>
		</div>

		<div>
			<h4 class="mb-3 text-xs font-medium uppercase tracking-[0.05em] text-fg-subtle">
				Product
			</h4>
			<ul class="space-y-2 text-sm">
				<li><a href="/#features" class="text-fg-muted hover:text-fg">Features</a></li>
				<li><a href="/#use-cases" class="text-fg-muted hover:text-fg">Use cases</a></li>
				<li><a href="/#editions" class="text-fg-muted hover:text-fg">Editions</a></li>
				<li><a href="/#quickstart" class="text-fg-muted hover:text-fg">Quickstart</a></li>
			</ul>
		</div>

		<div>
			<h4 class="mb-3 text-xs font-medium uppercase tracking-[0.05em] text-fg-subtle">
				Resources
			</h4>
			<ul class="space-y-2 text-sm">
				<li><a href="/docs" class="text-fg-muted hover:text-fg">Documentation</a></li>
				<li><a href="/docs/getting-started" class="text-fg-muted hover:text-fg">Getting started</a></li>
				<li><a href="/docs/config" class="text-fg-muted hover:text-fg">Config reference</a></li>
				<li><a href="https://github.com/kanakkholwal/docvia" class="text-fg-muted hover:text-fg">Changelog</a></li>
			</ul>
		</div>

		<div>
			<h4 class="mb-3 text-xs font-medium uppercase tracking-[0.05em] text-fg-subtle">
				Community
			</h4>
			<ul class="space-y-2 text-sm">
				<li><a href="https://github.com/kanakkholwal/docvia" class="text-fg-muted hover:text-fg">GitHub</a></li>
				<li><a href="https://www.npmjs.com/org/docvia" class="text-fg-muted hover:text-fg">npm</a></li>
				<li><a href="https://github.com/kanakkholwal/docvia/issues" class="text-fg-muted hover:text-fg">Report an issue</a></li>
				<li><a href="https://github.com/kanakkholwal/docvia/discussions" class="text-fg-muted hover:text-fg">Discussions</a></li>
			</ul>
		</div>
	</div>

	<div class="border-t border-border/60">
		<div
			class="mx-auto flex max-w-[1200px] flex-col items-start gap-2 px-6 py-6 text-xs text-fg-subtle md:flex-row md:items-center md:justify-between md:px-10"
		>
			<span>© {new Date().getFullYear()} docvia · Released under the MIT licence.</span>
			<span class="font-mono">v0.1 preview</span>
		</div>
	</div>
</footer>
