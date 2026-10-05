<script lang="ts">
import Hero from "#lib/sections/hero.svelte";
import HowItWorks from "#lib/sections/how-it-works.svelte";
import Cta from "#lib/sections/cta.svelte";
import Faq from "#lib/sections/faq.svelte";
import Numbers from "#lib/sections/numbers.svelte";
import Packages from "#lib/sections/packages.svelte";
import Quickstart from "#lib/sections/quickstart.svelte";
import Renderers from "#lib/sections/renderers.svelte";
import Statement from "#lib/sections/statement.svelte";
import Workers from "#lib/sections/workers.svelte";
</script>

<svelte:head>
	<title>docvia · Markdown docs, built into your app</title>
	<meta
		name="description"
		content="Collections, page tree, typed frontmatter and search for Next.js, SvelteKit and TanStack Start. Your bundler compiles the Markdown, rendered with React or Svelte."
	/>
	<meta property="og:title" content="docvia: Markdown docs, built into your app" />
</svelte:head>

<Hero />

<div class="mx-auto flex max-w-page flex-col gap-24 px-5 py-20 sm:px-10 sm:py-24 lg:px-16">
	<Statement />
	<HowItWorks />
	<Renderers />
	<Numbers />
	<Quickstart />
	<Workers />
	<Packages />
	<Faq />
	<Cta />
</div>
