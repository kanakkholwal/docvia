<script lang="ts">
import { afterNavigate } from "$app/navigation";
import { page } from "$app/state";
import Brand from "$lib/components/brand.svelte";
import SearchDialog from "$lib/components/docs/search-dialog.svelte";
import Sidebar from "$lib/components/docs/sidebar.svelte";
import Toc from "$lib/components/docs/toc.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { ArrowLeft, Github, Menu, X } from "@lucide/svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";

import type { LayoutProps } from "./$types";

let { children, data }: LayoutProps = $props();
let mobileNavOpen = $state(false);

afterNavigate(() => {
	mobileNavOpen = false;
});

// The current page's headings (from the [...slug] server load) feed the TOC.
const headings = $derived(
	(page.data.page as { headings?: { depth: number; text: string; id: string }[] } | undefined)
		?.headings ?? [],
);

const navLinks = [
	{ label: "Guides", href: "/docs/getting-started" },
	{ label: "Packages", href: "/docs/packages" },
];
</script>

<header class="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-5 sm:px-10">
		<div class="flex items-center gap-6">
			<Brand size="sm" />
			<span
				class="hidden items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-body-strong sm:inline-flex"
			>
				<span class="h-1 w-1 rounded-full bg-brand"></span>
				Docs
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

		<!-- No "Home" button: the wordmark already links to /, and spending the
		     primary style on "leave the docs" is the wrong emphasis for this page. -->
		<div class="flex items-center gap-1.5">
			<SearchDialog />
			<a
				href="https://github.com/kanakkholwal/docvia"
				class="inline-flex h-9.5 items-center gap-2 rounded-md px-2.5 text-[14px] font-medium text-body transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:bg-surface-card hover:text-ink"
			>
				<Github class="h-4 w-4 shrink-0" />
				<span class="hidden lg:inline">Star on GitHub</span>
				<span class="sr-only lg:hidden">Star on GitHub</span>
			</a>
			<ThemeToggle />
			<button
				aria-label="Toggle navigation"
				aria-expanded={mobileNavOpen}
				onclick={() => (mobileNavOpen = !mobileNavOpen)}
				class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md text-body transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:bg-surface-card hover:text-ink lg:hidden"
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
			class="max-h-[75vh] overflow-y-auto border-t border-hairline bg-canvas px-5 py-4 lg:hidden"
		>
			<Sidebar tree={data.tree} mobile />
			<!-- Theme toggle and GitHub already sit in the bar above; repeating
			     them here was two controls for each destination. -->
			<a
				href="/"
				onclick={() => (mobileNavOpen = false)}
				class="mt-4 flex min-h-11 items-center gap-2 border-t border-hairline pt-4 text-sm font-medium text-body transition-colors duration-(--motion-fast) ease-out hover:text-ink"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to docvia.dev
			</a>
		</div>
	{/if}
</header>

<div class="mx-auto flex max-w-page px-5 sm:px-10">
	<aside class="hidden w-60 shrink-0 border-r border-hairline lg:block">
		<Sidebar tree={data.tree} />
	</aside>

	<main id="main" class="min-w-0 flex-1 px-0 py-10 md:px-10">
		<div class="mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>

	<!-- No overflow here: the TOC scrolls its own list, and nesting the two
	     produced a scrollbar inside a scrollbar on long pages. -->
	<aside class="hidden w-56 shrink-0 border-l border-hairline xl:block">
		<div class="sticky top-16 py-10 pl-6">
			<Toc {headings} />
		</div>
	</aside>
</div>

<!-- Deliberately slimmer than the marketing footer: a full sitemap under every
     docs page would push the pager and "edit this page" off the fold. -->
<footer class="border-t border-hairline bg-surface-soft">
	<div
		class="mx-auto flex max-w-page flex-col items-start gap-3 px-5 py-6 text-[13px] text-muted sm:px-10 md:flex-row md:items-center md:justify-between"
	>
		<span>© {new Date().getFullYear()} docvia · Released under the MIT licence.</span>
		<nav class="flex items-center gap-5">
			<a
				href="/"
				class="transition-colors duration-(--motion-fast) ease-out hover:text-ink"
			>
				Home
			</a>
			<a
				href="https://github.com/kanakkholwal/docvia/releases"
				class="transition-colors duration-(--motion-fast) ease-out hover:text-ink"
			>
				Changelog
			</a>
			<a
				href="https://github.com/kanakkholwal/docvia"
				class="transition-colors duration-(--motion-fast) ease-out hover:text-ink"
			>
				GitHub
			</a>
		</nav>
	</div>
</footer>
