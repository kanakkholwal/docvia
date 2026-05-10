<script lang="ts">
import { ArrowRight } from "@lucide/svelte";
import PageHeader from "$lib/components/page-header.svelte";
import Prose from "$lib/components/prose.svelte";
import { Button } from "$lib/components/ui/button";
</script>

<svelte:head>
	<title>docvia — Documentation</title>
	<meta
		name="description"
		content="Documentation for docvia, a build-time documentation compiler for React and Svelte."
	/>
</svelte:head>

<PageHeader
	eyebrow="Introduction"
	title="What is docvia?"
	description="A build-time documentation compiler for React, Svelte, or any framework with a renderer adapter."
/>

<Prose>
	<p>
		<strong>docvia</strong> turns a directory of Markdown into typed,
		pre-rendered modules. There is no runtime Markdown parser shipped to the
		browser — every page is parsed, sanitized, and transformed into an
		intermediate representation at build time.
	</p>

	<h2>Why a compiler?</h2>
	<p>
		Most documentation toolchains ship the Markdown parser to the browser, or
		walk it on every server request. docvia treats your docs the way a modern
		bundler treats your source code: hash content, cache aggressively, and
		emit a tiny module graph the bundler can tree-shake.
	</p>

	<h2>Highlights</h2>
	<ul>
		<li><strong>Build-time first.</strong> Zero runtime parser.</li>
		<li>
			<strong>Incremental cache.</strong> Persisted between runs; second
			builds for unchanged content take milliseconds.
		</li>
		<li>
			<strong>Typed end-to-end.</strong> Frontmatter, route keys, and the
			source helper are all typed.
		</li>
		<li>
			<strong>Pluggable.</strong> Five hook points let you mutate the
			pipeline at any stage.
		</li>
	</ul>

	<h2>Next steps</h2>
	<p>
		Read the <a href="/getting-started">Getting started</a> guide, or jump
		straight to the
		<a href="/config">configuration reference</a>.
	</p>
</Prose>

<div class="mt-12 flex justify-end">
	<Button href="/getting-started">
		Getting started
		<ArrowRight />
	</Button>
</div>
