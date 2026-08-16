<script lang="ts">
import CompilerDeepDive from "$lib/sections/compiler-deep-dive.svelte";
import Cta from "$lib/sections/cta.svelte";
import Faq from "$lib/sections/faq.svelte";
import Features from "$lib/sections/features.svelte";
import Frameworks from "$lib/sections/frameworks.svelte";
import Hero from "$lib/sections/hero.svelte";
import OpenSource from "$lib/sections/open-source.svelte";
import Quickstart from "$lib/sections/quickstart.svelte";
import Stats from "$lib/sections/stats.svelte";
import UseCases from "$lib/sections/use-cases.svelte";

// Note: Comparison (vs hosted platforms) and Editions (managed/hosting tiers)
// are intentionally NOT on the landing page — docvia markets as a developer
// tool, not a hosting product. Those live on a dedicated self-host/hosting
// page (planned), backed by a real benchmark pipeline rather than claims.
</script>

<svelte:head>
	<title>Docvia · The build-time documentation compiler</title>
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

<!-- Bordered content frame — continuous vertical hairlines run down the whole
     page (vite-style); each section carries its own bottom divider. -->
<!-- Proof (Stats) sits after the pitch, not before it — vite.dev puts its
     social-proof beat late, once the reader has a reason to care. -->
<div class="mx-auto max-w-page border-x border-hairline">
	<Hero />
	<Frameworks />
	<Features />
	<CompilerDeepDive />
	<UseCases />
	<Stats />
	<Quickstart />
	<OpenSource />
	<Faq />
	<Cta />
</div>
