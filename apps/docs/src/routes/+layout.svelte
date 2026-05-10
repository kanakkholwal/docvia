<script lang="ts">
import Brand from "$lib/components/brand.svelte";
import Sidebar from "$lib/components/sidebar.svelte";
import ThemeToggle from "$lib/components/theme-toggle.svelte";
import { Button } from "$lib/components/ui/button";
import { Github } from "@lucide/svelte";
import type { Snippet } from "svelte";
import "../app.css";

let { children }: { children: Snippet } = $props();
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
>
	Skip to content
</a>

<div class="min-h-screen">
	<header
		class="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md"
	>
		<div
			class="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 md:px-6"
		>
			<div class="flex items-center gap-3">
				<Brand />
				<span
					class="hidden rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-xs font-mono text-fg-muted sm:inline"
				>
					v0.1
				</span>
			</div>
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="sm" href="/">Home</Button>
				<Button
					variant="ghost"
					size="icon"
					href="https://github.com/kanakkholwal/docvia"
					aria-label="GitHub"
				>
					<Github />
				</Button>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<div class="mx-auto flex max-w-[1280px] gap-8 px-4 md:px-6">
		<aside
			class="hidden w-64 shrink-0 border-r border-border/60 lg:block"
		>
			<div class="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto pr-4">
				<Sidebar />
			</div>
		</aside>
		<main id="main" class="min-w-0 flex-1 py-10 md:py-14">
			<div class="mx-auto max-w-3xl">
				{@render children()}
			</div>
		</main>
	</div>
</div>
