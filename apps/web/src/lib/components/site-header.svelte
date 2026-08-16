<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import { version } from "$lib/version.svelte";
import { ArrowRight, Github, Menu, X } from "@lucide/svelte";
import { cubicOut } from "svelte/easing";
import { slide } from "svelte/transition";

let mobileOpen = $state(false);

// On-page anchors only. Docs is reached through the Get started button, so a
// second link to the same place would just add a decision.
const navLinks = [
	{ label: "Features", href: "/#features" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Use cases", href: "/#use-cases" },
	{ label: "Quickstart", href: "/#quickstart" },
	{ label: "FAQ", href: "/#faq" },
];
</script>

<!-- ── Thin announcement strip ──────────────────────────────────────── -->
<div class="border-b border-hairline bg-surface-soft">
	<div
		class="mx-auto flex h-9 max-w-page items-center justify-center gap-2 px-5 text-[13px] text-body sm:px-10"
	>
		<span class="relative flex h-1.5 w-1.5 shrink-0">
			<span class="absolute inset-0 animate-ping rounded-full bg-brand opacity-60"></span>
			<span class="relative h-1.5 w-1.5 rounded-full bg-brand"></span>
		</span>
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
<header class="sticky top-0 z-40 border-b border-hairline bg-canvas">
	<div
		class="mx-auto flex h-20 max-w-page items-center justify-between gap-4 px-5 sm:px-10"
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
			<nav class="hidden items-center gap-1 lg:flex">
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
			<Button variant="primary" size="sm" href="/docs" class="hidden sm:inline-flex">
				Get started
			</Button>
			<button
				aria-label="Toggle menu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
				class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-md text-body transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:bg-surface-card hover:text-ink lg:hidden"
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
			class="border-t border-hairline bg-canvas px-5 py-3 lg:hidden"
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
					href="/docs"
					class="mt-1 inline-flex items-center justify-center rounded-md bg-brand px-3 py-2.5 text-[15px] font-medium text-on-brand"
				>
					Get started
				</a>
			</nav>
		</div>
	{/if}
</header>
