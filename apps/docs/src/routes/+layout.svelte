<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import SearchDialog from "$lib/components/search-dialog.svelte";
import Sidebar from "$lib/components/sidebar.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { Github, Menu, X } from "@lucide/svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";
import "../app.css";

import type { LayoutProps } from "./$types";

let { children, data }: LayoutProps = $props();
let mobileNavOpen = $state(false);
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-on-primary"
>
	Skip to content
</a>

<!-- Floating pill nav -->
<header class="sticky top-3 z-40 px-3 md:top-4 md:px-6">
	<div class="mx-auto max-w-6xl">
		<div
			class="flex h-14 items-center justify-between gap-3 rounded-full border border-hairline bg-canvas/90 pl-4 pr-2 shadow-[0_4px_24px_-12px_rgba(10,10,10,0.18)] backdrop-blur-md md:pl-6"
		>
			<div class="flex items-center gap-3">
				<Brand />
				<span
					class="hidden items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-body-strong sm:inline-flex"
				>
					<span class="h-1 w-1 rounded-full bg-brand-coral"></span>
					Docs · v0.1
				</span>
			</div>

			<nav
				class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
			>
				<a
					href="/getting-started"
					class="rounded-full px-3 py-1.5 text-[14px] font-medium text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
				>
					Guides
				</a>
				<a
					href="/packages"
					class="rounded-full px-3 py-1.5 text-[14px] font-medium text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
				>
					Packages
				</a>
				<a
					href="https://github.com/kanakkholwal/docvia"
					class="rounded-full px-3 py-1.5 text-[14px] font-medium text-body transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
				>
					Source
				</a>
			</nav>

			<div class="flex items-center gap-1">
				<SearchDialog />
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
					href="https://docvia.dev"
					class="hidden h-9 rounded-full sm:inline-flex"
				>
					Home
				</Button>
				<button
					aria-label="Toggle navigation"
					aria-expanded={mobileNavOpen}
					onclick={() => (mobileNavOpen = !mobileNavOpen)}
					class="inline-flex h-10 w-10 items-center justify-center rounded-full text-body transition-colors hover:bg-surface-card hover:text-ink lg:hidden"
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
				class="mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-hairline bg-canvas p-4 shadow-[0_4px_24px_-12px_rgba(10,10,10,0.18)] lg:hidden"
			>
				<Sidebar tree={data.tree} />
			</div>
		{/if}
	</div>
</header>

<div class="mx-auto flex max-w-7xl gap-10 px-4 pt-6 md:px-6 md:pt-8">
	<aside class="hidden w-60 shrink-0 lg:block">
		<div
			class="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2"
		>
			<Sidebar tree={data.tree} />
		</div>
	</aside>
	<main id="main" class="min-w-0 flex-1 pb-24 pt-6 md:pt-10">
		<div class="mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>
</div>

<footer class="border-t border-hairline bg-surface-soft">
	<div
		class="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-6"
	>
		<span>© {new Date().getFullYear()} docvia · MIT licence</span>
		<a
			href="https://github.com/kanakkholwal/docvia"
			class="hover:text-ink"
		>
			Edit on GitHub
		</a>
	</div>
</footer>
