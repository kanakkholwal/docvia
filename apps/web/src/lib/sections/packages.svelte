<script lang="ts">
import BentoCard from "#lib/components/site/bento-card.svelte";
import Section from "#lib/components/site/section.svelte";
import { RollText } from "#lib/components/text/roll-text/index.ts";

// Descriptions paraphrase each packages/*/package.json; every row links to its docs page.
const groups = [
	{
		title: "What you install",
		description: "init picks these for your framework.",
		packages: [
			["cli", "Adds docs to a Next.js, SvelteKit or TanStack Start app"],
			["source", "defineDocs(), loader(), page tree and route params"],
			["search", "Orama index from your pages, plus a Request handler"],
			["renderer-react", "Renders compiled pages as React components"],
			["renderer-svelte", "Renders compiled pages as Svelte components"],
		],
	},
	{
		title: "Bundler plugins",
		description: "Compile Markdown inside the build you already run.",
		packages: [
			["plugin-vite", "SvelteKit, TanStack Start and any Vite app, with HMR"],
			["plugin-next", "Next.js with webpack or Turbopack"],
		],
	},
	{
		title: "Content plugins",
		description: "Run at build time; nothing ships to the browser.",
		packages: [
			["plugin-shiki", "Syntax highlighting with light and dark themes"],
			["plugin-mermaid", "Mermaid fences become diagram components"],
			["plugin-openapi", "openapi METHOD /path fences become endpoint cards"],
		],
	},
	{
		title: "Under the hood",
		description: "Usable on their own if you build your own tooling.",
		packages: [
			["core", "Markdown parsing and sanitizing"],
			["ir", "The framework-agnostic tree every renderer reads"],
			["schema", "Standard Schema frontmatter checks and type generation"],
			["runtime", "Incremental compile service for build, dev and SSR"],
			["renderer-core", "Shared renderer engine for adapters"],
			["ssr", "Request-time rendering for Node and edge servers"],
			["compiler", "Parallel build and module graph"],
			["plugins", "Plugin runner and config loader"],
		],
	},
];
const total = groups.reduce((n, g) => n + g.packages.length, 0);
</script>

<Section id="packages" number={6} title="what's in the box." description="{total} packages on npm, each MIT licensed. Most apps install five, and init chooses them.">
	<div class="grid items-start gap-3 md:grid-cols-2">
		{#each [groups.slice(0, 3), groups.slice(3)] as column}
			<div class="grid gap-3">
				{#each column as group}
					<BentoCard title={group.title} description={group.description}>
				<ul class="dim-list -my-1 divide-y divide-dashed divide-hairline-strong">
					{#each group.packages as [name, body]}
						<li>
							<a href="/docs/packages/{name}" class="group/roll flex items-baseline gap-3 py-2.5">
								<span class="w-36 shrink-0 font-mono text-sm text-ink">
									<RollText text={name} groupHover size="sm" class="cursor-[inherit]" />
								</span>
								<span class="text-sm text-muted">{body}</span>
							</a>
						</li>
					{/each}
				</ul>
					</BentoCard>
				{/each}
			</div>
		{/each}
	</div>
</Section>
