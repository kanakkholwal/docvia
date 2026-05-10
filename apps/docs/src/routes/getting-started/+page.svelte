<script lang="ts">
import PageHeader from "$lib/components/page-header.svelte";
import Prose from "$lib/components/prose.svelte";
import { Button } from "$lib/components/ui/button";
import { ArrowLeft, ArrowRight } from "@lucide/svelte";
</script>

<svelte:head>
	<title>Getting started · docvia</title>
</svelte:head>

<PageHeader
	eyebrow="Introduction"
	title="Getting started"
	description="Install the CLI, scaffold a project, and compile your first build in three commands."
/>

<Prose>
	<h2>Install</h2>
	<pre><code>pnpm add -D @docvia/cli
pnpm add @docvia/renderer-react   # or @docvia/renderer-svelte</code></pre>

	<h2>Scaffold</h2>
	<pre><code>npx docvia init</code></pre>
	<p>
		The <code>init</code> command autodetects your renderer from
		<code>package.json</code>. Pass <code>--renderer react</code> or
		<code>--renderer svelte</code> to choose explicitly. It refuses to
		overwrite an existing config without <code>--force</code>.
	</p>

	<h2>Build</h2>
	<pre><code>npx docvia build</code></pre>
	<p>
		The first run compiles every Markdown file in <code>docs/</code> and
		writes a five-file module graph to <code>.docvia/</code>. Subsequent runs
		read <code>.docvia.cache.json</code> and skip files whose content hash is
		unchanged.
	</p>

	<h2>Watch</h2>
	<pre><code>npx docvia dev</code></pre>
	<p>
		The dev command watches both your source directory and your config file.
		Rebuilds are serialized so concurrent saves never race on the generated
		module graph.
	</p>
</Prose>

<div class="mt-12 flex items-center justify-between">
	<Button variant="ghost" href="/">
		<ArrowLeft />
		What is docvia?
	</Button>
	<Button href="/config">
		Config reference
		<ArrowRight />
	</Button>
</div>
