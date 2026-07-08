<script lang="ts">
import { afterNavigate } from "$app/navigation";
import { page } from "$app/state";
import Brand from "$lib/components/brand.svelte";
import SearchDialog from "$lib/components/search-dialog.svelte";
import Sidebar from "$lib/components/sidebar.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import Toc from "$lib/components/toc.svelte";
import { Button } from "$lib/components/ui/button";
import { version, refreshVersion } from "$lib/version.svelte";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { Github, Menu, X } from "@lucide/svelte";
import { onMount } from "svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";
import "../app.css";

import type { LayoutProps } from "./$types";

let { children, data }: LayoutProps = $props();
let mobileNavOpen = $state(false);

onMount(refreshVersion);
afterNavigate(() => {
	mobileNavOpen = false;
});

// The current page's headings (from the [...slug] server load) feed the TOC.
const headings = $derived(
	(page.data.page as { headings?: { depth: number; text: string; id: string }[] } | undefined)
		?.headings ?? [],
);

const navLinks = [
	{ label: "Guides", href: "/getting-started" },
	{ label: "Packages", href: "/packages" },
];
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-on-primary"
>
	Skip to content
</a>

<!-- ── Full-width top bar (matches apps/web) ────────────────────────── -->
<header
	class="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md"
>
	<div
		class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6"
	>
		<div class="flex items-center gap-6">
			<Brand />
			<span
				class="hidden items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-body-strong sm:inline-flex"
			>
				<span class="h-1 w-1 rounded-full bg-brand"></span>
				Docs · v{version.current}
			</span>
			<nav class="hidden items-center gap-1 md:flex">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-md px-2.5 py-1.5 text-[14px] font-medium text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<div class="flex items-center gap-1.5">
			<SearchDialog />
			<a
				href="https://github.com/kanakkholwal/docvia"
				aria-label="GitHub"
				class="inline-flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
			>
				<Github class="h-4 w-4" />
			</a>
			<ThemeToggle />
			<Button
				variant="primary"
				size="sm"
				href="https://docvia.dev"
				class="hidden sm:inline-flex"
			>
				Home
			</Button>
			<button
				aria-label="Toggle navigation"
				aria-expanded={mobileNavOpen}
				onclick={() => (mobileNavOpen = !mobileNavOpen)}
				class="inline-flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors hover:bg-surface-card hover:text-ink lg:hidden"
			>
				{#if mobileNavOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	{#if mobileNavOpen}
		<div
			transition:slide={{ duration: 240, easing: cubicOut }}
			class="max-h-[75vh] overflow-y-auto border-t border-hairline bg-canvas px-4 py-4 lg:hidden"
		>
			<Sidebar tree={data.tree} />
			<div
				class="mt-4 flex items-center justify-between border-t border-hairline pt-4"
			>
				<a
					href="https://github.com/kanakkholwal/docvia"
					class="inline-flex items-center gap-2 text-sm font-medium text-body hover:text-ink"
				>
					<Github class="h-4 w-4" />
					GitHub
				</a>
				<ThemeToggle />
			</div>
		</div>
	{/if}
</header>

<div class="mx-auto flex max-w-7xl px-4 md:px-6">
	<!-- Sidebar -->
	<aside class="hidden w-60 shrink-0 border-r border-hairline lg:block">
		<div class="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-6">
			<Sidebar tree={data.tree} />
		</div>
	</aside>

	<!-- Content -->
	<main id="main" class="min-w-0 flex-1 px-0 py-10 md:px-10">
		<div class="mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>

	<!-- Table of contents -->
	<aside class="hidden w-56 shrink-0 border-l border-hairline xl:block">
		<div class="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-10 pl-6">
			<Toc {headings} />
		</div>
	</aside>
</div>

<footer class="border-t border-hairline bg-surface-soft">
	<div
		class="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-6"
	>
		<span>© {new Date().getFullYear()} docvia · MIT licence</span>
		<a href="https://github.com/kanakkholwal/docvia" class="hover:text-ink">
			docvia on GitHub
		</a>
	</div>
</footer>
