<script lang="ts">
	import Hero from "$lib/sections/hero.svelte";
	import Stats from "$lib/sections/stats.svelte";
	import Features from "$lib/sections/features.svelte";
	import CompilerDeepDive from "$lib/sections/compiler-deep-dive.svelte";
	import UseCases from "$lib/sections/use-cases.svelte";
	import Comparison from "$lib/sections/comparison.svelte";
	import Editions from "$lib/sections/editions.svelte";
	import Quickstart from "$lib/sections/quickstart.svelte";
	import Faq from "$lib/sections/faq.svelte";
	import Cta from "$lib/sections/cta.svelte";
</script>

<svelte:head>
	<title>docvia — The build-time documentation compiler</title>
	<meta
		name="description"
		content="docvia compiles your Markdown into typed, pre-rendered modules for React, Svelte, and any framework with a renderer adapter. Incremental builds, full-text search, zero runtime parsing."
	/>
	<meta property="og:title" content="docvia — The build-time documentation compiler" />
	<meta
		property="og:description"
		content="Compile your docs the way modern bundlers compile your source code: hashing, caching, parallelism, typed output."
	/>
</svelte:head>

<Hero />
<Stats />
<Features />
<CompilerDeepDive />
<UseCases />
<Comparison />
<Editions />
<Quickstart />
<Faq />
<Cta />
