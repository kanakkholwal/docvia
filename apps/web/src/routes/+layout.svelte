<script lang="ts">
	import "../app.css";
	import Brand from "$lib/components/brand.svelte";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import { Button } from "$lib/components/ui/button";
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
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
		class="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 md:px-10"
	>
		<Brand />
		<nav class="flex items-center gap-1">
			<Button variant="ghost" size="sm" href="/#features">Features</Button>
			<Button variant="ghost" size="sm" href="/docs">Docs</Button>
			<Button
				variant="ghost"
				size="sm"
				href="https://github.com/kanakkholwal/docvia"
			>
				GitHub
			</Button>
			<ThemeToggle />
		</nav>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="border-t border-border/60 bg-bg-subtle/40">
	<div
		class="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10"
	>
		<div class="flex items-center gap-3">
			<Brand />
			<span class="text-sm text-fg-muted">
				· Build-time documentation compiler
			</span>
		</div>
		<div class="flex items-center gap-6 text-sm text-fg-muted">
			<a href="/docs" class="hover:text-fg">Docs</a>
			<a
				href="https://github.com/kanakkholwal/docvia"
				class="hover:text-fg">GitHub</a
			>
			<a
				href="https://www.npmjs.com/package/@docvia/cli"
				class="hover:text-fg">npm</a
			>
			<span>MIT licensed</span>
		</div>
	</div>
</footer>
