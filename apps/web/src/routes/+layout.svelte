<script lang="ts">
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/geist-pixel";
import { afterNavigate, onNavigate } from "$app/navigation";
import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from "$app/env/public";
import { pageview, setAnalyticsProvider, trackClicks } from "#lib/analytics/index.ts";
import NavProgress from "#lib/components/site/nav-progress.svelte";
import { onMount, type Snippet } from "svelte";
import "../app.css";

let { children }: { children: Snippet } = $props();

// Analytics stay off until a key is configured; the provider loads after the page is interactive.
onMount(() => {
	const key = PUBLIC_POSTHOG_KEY;
	if (!key) return;
	import("#lib/analytics/posthog.ts")
		.then(({ createPostHogProvider }) => createPostHogProvider({ key, host: PUBLIC_POSTHOG_HOST }))
		.then(setAnalyticsProvider)
		.catch(() => {});
	return trackClicks(document);
});
afterNavigate(({ to }) => {
	if (to?.url) pageview(to.url);
});

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
