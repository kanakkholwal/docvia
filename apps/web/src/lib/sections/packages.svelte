<script lang="ts">
import BentoCard from "#lib/components/site/bento-card.svelte";
import Section from "#lib/components/site/section.svelte";
import { RollText } from "#lib/components/text/roll-text/index.ts";

// Every row links to its docs page; names with a slash are subpaths, not packages.
const groups = [
	{
		title: "What you install",
		description: "init picks these for your framework.",
		packages: [
			["cli", "Adds docs to a Next.js, SvelteKit or TanStack Start app"],
			["core", "Everything that runs where docs are served, Workers included"],
			["build", "Compiles Markdown inside the Vite or Next.js build you run"],
			["search", "Orama index from your pages, plus a Request handler"],
		],
	},
	{
		title: "Content plugins",
		description: "Run at build time; nothing ships to the browser.",
		packages: [
			["plugin-shiki", "Syntax highlighting with light and dark themes"],
			["plugin-mermaid", "Mermaid fences become diagram components"],
			["plugin-openapi", "API reference pages and code samples from an OpenAPI spec"],
		],
	},
	{
		title: "Standalone",
		description: "No other docvia package needed.",
		packages: [["markdown", "20 KB Markdown renderer that streams AI answers"]],
	},
	{
		title: "Inside @docvia/core",
		description: "Subpaths: an app bundles only what it imports.",
		packages: [
			["core/markdown", "Markdown parsing and the page pipeline"],
			["core/render", "The framework-agnostic rendering engine"],
			["core/source", "defineDocs(), loader(), page tree and route params"],
			["core/ssr", "Request-time rendering for Workers and Node"],
			["core/react", "Renders pages as React components"],
			["core/svelte", "Renders pages as Svelte components"],
		],
	},
	{
		title: "Inside @docvia/build",
		description: "Node only, at build time.",
		packages: [
			["build/vite", "SvelteKit, TanStack Start and any Vite app, with HMR"],
			["build/next", "Next.js with webpack or Turbopack"],
			["build/pipeline", "Incremental compile service for build, dev and SSR"],
		],
	},
];
const total = groups
	.flatMap((g) => g.packages)
	.filter(([name]) => !name.includes("/")).length;
</script>

<Section id="packages" number={6} title="what's in the box." description="{total} packages on npm, each MIT licensed. Most apps install four, and init chooses them.">
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
