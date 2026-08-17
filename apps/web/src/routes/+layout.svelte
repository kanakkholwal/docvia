<script lang="ts">
import "@fontsource-variable/inter";
import "@fontsource-variable/geist-mono";
import type { Snippet } from "svelte";
import "../app.css";

let { children }: { children: Snippet } = $props();
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand"
>
	Skip to content
</a>

{@render children()}
