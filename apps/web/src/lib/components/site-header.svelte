<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import { VERSION } from "$lib/version";
import { Github, Menu, X } from "@lucide/svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";

let mobileOpen = $state(false);


const navLinks = [
	{ label: "Features", href: "/#features" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Docs", href: "/docs" },
];
</script>

<!-- ── Full-width top bar (vite-style) ──────────────────────────────── -->
<header class="sticky top-0 z-40 border-b border-hairline bg-canvas">
	<div
		class="mx-auto flex h-20 max-w-page items-center justify-between gap-4 px-5 sm:px-10"
	>
		<!-- Left: brand + version + nav -->
		<div class="flex items-center gap-6">
			<Brand size="sm" />
				<a
				href="https://github.com/kanakkholwal/docvia/releases"
				class="hidden h-7 items-center gap-1.5 rounded-full bg-surface-card pl-2.5 pr-3 text-[12px] font-medium tracking-[0.01em] text-body transition-colors duration-(--motion-fast) ease-out hover:bg-surface-strong hover:text-ink sm:inline-flex"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
				v{VERSION}
			</a>
			<nav class="hidden items-center gap-1 md:flex">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-md px-2.5 py-1 text-sm font-medium text-body transition-colors duration-(--motion-fast) ease-out hover:bg-surface-card hover:text-ink"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Right: actions -->
		<div class="flex items-center gap-1.5">
			<Button
				href="https://github.com/kanakkholwal/docvia"
				variant="ghost"
				size="sm"
			>
				<Github class="h-4 w-4 shrink-0" />
				<span class="hidden lg:inline">Star on GitHub</span>
				<span class="sr-only lg:hidden">Star on GitHub</span>
			</Button>
			<ThemeToggle />
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
			class="border-t border-hairline bg-canvas px-5 py-3 md:hidden"
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
					href="https://github.com/kanakkholwal/docvia"
					class="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-[15px] font-medium text-body hover:bg-surface-card hover:text-ink"
				>
					<Github class="h-4 w-4" />
					Star on GitHub
				</a>
				<a
					href="/docs"
					class="mt-1 inline-flex items-center justify-center rounded-md bg-brand px-3 py-2.5 text-[15px] font-medium text-on-brand"
				>
					Get started
				</a>
			</nav>
		</div>
	{/if}
</header>
