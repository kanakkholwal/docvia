<script lang="ts">
	import { type ParseOptions, parse } from "@docvia/markdown";
	import Blocks from "./Blocks.svelte";
	import type { SvelteRenderOptions } from "./context";

	let { source, ...options }: SvelteRenderOptions & ParseOptions & { source: string } = $props();
	const root = $derived(parse(source, options));
</script>

<Blocks nodes={root.children} {options} />
