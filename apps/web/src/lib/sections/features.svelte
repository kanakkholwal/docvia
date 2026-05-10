<script lang="ts">
import {
	Boxes,
	FileText,
	Gauge,
	Layers,
	Search,
	ShieldCheck,
} from "@lucide/svelte";
import { Card } from "$lib/components/ui/card";

const features = [
	{
		icon: Gauge,
		title: "Build-time first",
		body: "No runtime markdown parser ships to the browser. Pages are pre-rendered into a tiny module graph at build time.",
	},
	{
		icon: Layers,
		title: "Incremental cache",
		body: "A content-addressable cache skips unchanged files. Subsequent builds for unchanged content take milliseconds.",
	},
	{
		icon: FileText,
		title: "Typed frontmatter",
		body: "Extend the built-in schema with a Zod object. docvia generates a typed Frontmatter interface for every collection.",
	},
	{
		icon: Boxes,
		title: "Framework adapters",
		body: "First-party React and Svelte renderers, with a Vite plugin and Next.js wrapper for direct integration.",
	},
	{
		icon: Search,
		title: "Section-level search",
		body: "Built-in Orama indexing groups by heading. Field-weighted ranking gives fast, accurate results client-side.",
	},
	{
		icon: ShieldCheck,
		title: "Sanitized by default",
		body: "Markdown passes through a strict allow-list. Script, iframe, object and embed tags are blocked.",
	},
];
</script>

<section id="features" class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-16 max-w-2xl text-center">
			<span
				class="text-xs font-medium uppercase tracking-[0.05em] text-accent"
			>
				Why docvia
			</span>
			<h2
				class="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Engineered for compile-time speed.
			</h2>
			<p class="mt-4 text-lg text-fg-muted">
				The same primitives that make modern bundlers fast — hashing,
				caching, parallelism — applied to documentation.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature}
				<Card class="flex flex-col gap-3 transition-colors hover:border-accent/30">
					<div
						class="grid h-10 w-10 place-items-center rounded-md bg-accent-subtle text-accent"
					>
						<feature.icon class="h-5 w-5" />
					</div>
					<h3 class="font-display text-lg font-semibold tracking-tight">
						{feature.title}
					</h3>
					<p class="text-sm leading-relaxed text-fg-muted">
						{feature.body}
					</p>
				</Card>
			{/each}
		</div>
	</div>
</section>
