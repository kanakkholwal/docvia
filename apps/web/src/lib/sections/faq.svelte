<script lang="ts">
import { Accordion } from "$lib/components/ui/accordion";

// Every answer here is checked against the code. No claim goes in that a
// reader could not verify by opening the repo.
const faqs = [
	{
		q: "Does it ship a Markdown parser to the browser?",
		a: "No. Parsing, sanitizing, and the IR transform all run at build time. The browser gets pre-rendered output. Syntax highlighting is a build-time plugin too, so no highlighter ships either.",
	},
	{
		q: "How is this different from a Markdown library?",
		a: "Libraries like react-markdown parse on every render. docvia parses once at build time, caches on a content hash, and emits a typed module graph your bundler can tree-shake.",
	},
	{
		q: "Am I locked into a framework?",
		a: "No. Markdown compiles to a framework-agnostic IR. React and Svelte renderers ship first-party, and any framework works by implementing a RendererAdapter against that IR.",
	},
	{
		q: "Can I use React components inside Markdown?",
		a: "Yes, through directives. Register a component in your config, then write :::counter in Markdown. That is the supported mechanism; docvia does not compile MDX.",
	},
	{
		q: "Can non-engineers contribute safely?",
		a: "Frontmatter is validated against your Zod schema at compile time, and the matching TypeScript types are generated. A missing or misspelled field fails the build rather than shipping.",
	},
	{
		q: "Can I self-host?",
		a: "That is the only mode. docvia is a build tool that outputs a module graph you deploy anywhere: static hosts, Cloudflare, a VPC, on-prem. No required service, no telemetry.",
	},
	{
		q: "Is it free?",
		a: "Yes, MIT licensed. You run the build yourself, so there is nothing to meter and no paid tier.",
	},
	{
		q: "Is it production ready?",
		a: "v1.0.0 is published and this site's documentation is compiled by it. Breaking changes follow semver, and every release ships a changeset describing what moved.",
	},
];
</script>

<section id="faq" class="border-b border-hairline bg-surface-soft scroll-mt-20">
	<div class="mx-auto max-w-page px-5 py-14 sm:px-10 sm:py-28">
		<div class="mb-12 text-center">
			<span class="label-meta">FAQ</span>
			<h2
				class="mx-auto mt-4 max-w-2xl text-balance font-display text-[32px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-[48px] sm:leading-none"
			>
				Frequently asked questions.
			</h2>
		</div>

		<div
			class="mx-auto max-w-3xl rounded-md border border-hairline bg-canvas px-6"
		>
			{#each faqs as faq, i}
				<Accordion question={faq.q} open={i === 0}>
					<p>{faq.a}</p>
				</Accordion>
			{/each}
		</div>
	</div>
</section>
