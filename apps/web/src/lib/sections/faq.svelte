<script lang="ts">
import { Accordion } from "$lib/components/ui/accordion";
import { Badge } from "$lib/components/ui/badge";

const faqs = [
	{
		q: "Which frameworks does docvia support?",
		a: "First-party renderers ship for React (with Next.js integration via @docvia/plugin-next) and Svelte (with Vite integration via @docvia/plugin-vite). The renderer contract is small — any framework that can render a tree of nodes can implement an adapter.",
	},
	{
		q: "How is this different from a typical Markdown library?",
		a: "Most Markdown tools either parse at request time (slow, large bundles) or at build time without caching (slow rebuilds). docvia parses, sanitizes, and transforms once at build time, persists a content-addressable cache, and emits a typed module graph the bundler can tree-shake.",
	},
	{
		q: "Can I bring my own renderer?",
		a: "Yes. RendererAdapter is a small interface — implement renderPage(doc) and renderManifest(pages) and you can target Vue, Solid, Astro, or anything else. The IR is intentionally framework-agnostic.",
	},
	{
		q: "How do I extend the frontmatter schema?",
		a: "Pass a Zod object as the frontmatter option in defineConfig. docvia merges it with the built-in schema, validates every page at build time, and generates a typed Frontmatter interface for each collection in types.d.ts.",
	},
	{
		q: "Does it ship a Markdown parser to the browser?",
		a: "No. The parser, sanitizer, and IR transformer all run at build time. The browser receives pre-rendered output plus, optionally, the Orama search index for client-side search.",
	},
	{
		q: "How are incremental builds handled?",
		a: "A .docvia.cache.json file stores per-file content hashes alongside the config and plugin cache keys. Files whose hashes are unchanged are skipped; the rest go through the full pipeline. The cache is invalidated automatically when the tool, config, or plugin set changes.",
	},
	{
		q: "Is it production ready?",
		a: "v0.1 is a public preview. The core compiler, CLI, and integrations are stable enough to use in real projects, but APIs may shift before v1.0. Each release ships with a changeset describing what changed.",
	},
	{
		q: "What's the licence?",
		a: "MIT, for every package in the workspace.",
	},
];
</script>

<section class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-12 max-w-2xl text-center">
			<Badge variant="accent" class="mb-4">FAQ</Badge>
			<h2
				class="font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Questions, answered.
			</h2>
		</div>

		<div
			class="mx-auto max-w-3xl divide-y divide-border/60 rounded-xl border border-border bg-bg-subtle px-6"
		>
			{#each faqs as faq, i}
				<Accordion question={faq.q} open={i === 0}>
					<p>{faq.a}</p>
				</Accordion>
			{/each}
		</div>
	</div>
</section>
