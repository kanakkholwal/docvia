<script lang="ts">
import Section from "#lib/components/site/section.svelte";
import * as Accordion from "#lib/components/ui/accordion/index.ts";

// Each answer was checked against packages/* and .local/bench/results.md on 2026-10-10.
const faqs = [
	{
		q: "Does a Markdown parser ship to the browser?",
		a: "Not for your docs. Your bundler compiles Markdown ahead of time, and Shiki highlighting is baked into the output, so neither a parser nor a highlighter reaches the browser or the server bundle.",
	},
	{
		q: "What if my Markdown only exists at runtime, like AI answers?",
		a: "Use @docvia/markdown. It is a separate, dependency-free package (about 20 KB minified) that renders Markdown in the browser or on a server, streams AI answers as they arrive, and works in any app without the rest of docvia.",
	},
	{
		q: "Which frameworks does it support?",
		a: "Next.js, SvelteKit and TanStack Start, rendered with React or Svelte through the same Renderer component. The compiled tree is framework-agnostic, so another renderer only has to implement the adapter in @docvia/core/render.",
	},
	{
		q: "Does it work with npm, yarn and bun?",
		a: "Yes. docvia init detects your package manager from the lockfile and installs with it. It was tested by creating and building Next.js, SvelteKit and TanStack Start apps with each one.",
	},
	{
		q: "Can I use components inside Markdown?",
		a: "Yes, through directives such as :::callout, mapped to components in your config, with optional hydration. docvia does not compile MDX.",
	},
	{
		q: "Can it document an API?",
		a: "Yes. @docvia/plugin-openapi turns an OpenAPI or Swagger spec into reference pages with code samples, and its proxy lets readers send real requests without CORS errors.",
	},
	{
		q: "Which schema libraries work for frontmatter?",
		a: "Any Standard Schema library: Zod, Valibot, ArkType and others. A missing or wrong field fails the build, and page.data is typed from the schema.",
	},
	{
		q: "Does it run on Cloudflare Workers?",
		a: "Yes. Page bodies load lazily, so at 1,500 pages the server bundle imports in under 100 ms with about 10 MB of heap. This site builds for Workers with adapter-cloudflare.",
	},
	{
		q: "Is it faster than VitePress, Starlight, Nextra or Docusaurus?",
		a: "Sometimes. The numbers section compares them on the same pages: Starlight builds a little faster and VitePress shows the first page and edits sooner, while docvia builds faster and shows pages and edits sooner than Nextra and Docusaurus. docvia's difference is that docs live inside the app you already ship.",
	},
	{
		q: "Is it free?",
		a: "Yes. Every package is MIT licensed, there is no hosted service and nothing phones home.",
	},
];
</script>

<Section id="faq" number={7} title="questions." description="If yours is missing, open a discussion on GitHub.">
	<Accordion.Root type="single" class="w-full max-w-3xl divide-y-0 rounded-none border-0 border-t border-dashed border-hairline-strong">
			{#each faqs as item, i}
				<Accordion.Item value="faq-{i}" class="border-b border-dashed border-hairline-strong">
					<Accordion.Trigger class="py-4 text-left text-base font-medium text-ink">{item.q}</Accordion.Trigger>
					<Accordion.Content class="pb-4 text-sm leading-relaxed text-body">{item.a}</Accordion.Content>
				</Accordion.Item>
			{/each}
	</Accordion.Root>
</Section>
