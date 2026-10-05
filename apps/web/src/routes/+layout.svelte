<script lang="ts">
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/geist-pixel";
import { onNavigate } from "$app/navigation";
import NavProgress from "#lib/components/site/nav-progress.svelte";
import type { Snippet } from "svelte";
import "../app.css";

let { children }: { children: Snippet } = $props();

onNavigate((navigation) => {
	const samePage = navigation.from?.url.pathname === navigation.to?.url.pathname;
	if (samePage || !document.startViewTransition) return;
	return new Promise((resolve) => {
		document.startViewTransition(async () => {
			resolve();
			await navigation.complete;
		});
	});
});
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand"
>
	Skip to content
</a>

<NavProgress />

{@render children()}
