<script lang="ts">
import { Accordion } from "$lib/components/ui/accordion";

const faqs = [
	{
		q: "Can I self-host docvia, or am I locked into a cloud?",
		a: "docvia is a build pipeline you own. It produces a static module graph that you deploy wherever you want — Vercel, Cloudflare, an S3 bucket, your VPC, or an on-prem box. There is no required cloud, no proprietary runtime, and no telemetry calling home.",
	},
	{
		q: "Do I have to use MDX? Can non-engineers contribute?",
		a: "Plain Markdown works out of the box. MDX is opt-in for teams that want React components in content. Frontmatter is validated against your Zod schema, so PMs, support, and marketers can edit content with the same safety as engineers — typos and missing fields fail the build.",
	},
	{
		q: "Will my docs be locked into one framework?",
		a: "No. docvia parses Markdown into a framework-agnostic Intermediate Representation. Renderer adapters target React, Svelte, Vite, and Next.js today; the contract is small enough that Vue, Solid, or Astro adapters are a few hundred lines. Switch renderers without rewriting content.",
	},
	{
		q: "Is docvia free?",
		a: "Yes. docvia is MIT-licensed and free — it's a build tool you run yourself, so there is nothing to meter. If you enable AI search, you bring your own Claude or OpenAI key, so that bill is yours and we never sit in the middle of it.",
	},
	{
		q: "How is this different from a typical Markdown library?",
		a: "Most Markdown tools either parse at request time (slow, large bundles) or at build time without caching (slow rebuilds). docvia parses, sanitizes, and transforms once at build time, persists a content-addressable cache, and emits a typed module graph the bundler can tree-shake.",
	},
	{
		q: "How are incremental builds handled?",
		a: "A .docvia.cache.json file stores per-file content hashes alongside the config and plugin cache keys. Files whose hashes are unchanged are skipped; the rest go through the full pipeline. The cache is invalidated automatically when the tool, config, or plugin set changes.",
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
		q: "Is it production ready?",
		a: "v0.1 is a public preview. The core compiler, CLI, and integrations are stable enough to use in real projects, but APIs may shift before v1.0. Each release ships with a changeset describing what changed.",
	},
	{
		q: "What's the licence?",
		a: "MIT, for every package in the workspace — the compiler, the CLI, the renderers, and the plugins.",
	},
];
</script>

<section id="faq" class="border-b border-hairline bg-surface-soft scroll-mt-16">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<div class="mb-12 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
			>
				FAQ
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-display-2 lg:leading-[1.05]"
			>
				Frequently asked questions.
			</h2>
		</div>

		<div
			class="mx-auto max-w-3xl divide-y divide-hairline rounded-lg border border-hairline bg-canvas px-6"
		>
			{#each faqs as faq, i}
				<Accordion question={faq.q} open={i === 0}>
					<p>{faq.a}</p>
				</Accordion>
			{/each}
		</div>
	</div>
</section>
