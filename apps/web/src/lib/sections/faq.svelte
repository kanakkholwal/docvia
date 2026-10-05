<script lang="ts">
import Section from "#lib/components/site/section.svelte";
import * as Accordion from "#lib/components/ui/accordion/index.ts";

// Each answer was checked against packages/* on 2026-10-06; see .local/redesign-audit.md.
const faqs = [
	{
		q: "Does a Markdown parser ship to the browser?",
		a: "No. Your bundler compiles Markdown ahead of time, and Shiki highlighting is baked into the output, so neither a parser nor a highlighter reaches the browser or the server bundle.",
	},
	{
		q: "How is this different from react-markdown?",
		a: "Libraries like react-markdown parse on every render. docvia compiles each page once in your build and loads page bodies lazily, one module per page.",
	},
	{
		q: "Which frameworks does it support?",
		a: "Next.js, SvelteKit and TanStack Start, rendered with React or Svelte. The compiled tree is framework-agnostic, so a new renderer only has to implement the adapter contract in renderer-core.",
	},
	{
		q: "Can I use components inside Markdown?",
		a: "Yes, through directives such as :::counter, mapped to components in your config, with optional hydration. docvia does not compile MDX.",
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
