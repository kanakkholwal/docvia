<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import { Check, Cloud, Github } from "@lucide/svelte";

const editions = [
	{
		name: "Open source",
		price: "Free",
		tagline: "Self-host. Forever free under MIT.",
		highlighted: true,
		cta: { label: "Get started", href: "/docs", variant: "primary" as const },
		features: [
			"Full compiler and CLI",
			"React and Svelte renderers",
			"Vite and Next.js integrations",
			"Section-level Orama search",
			"Plugin system with 5 hook points",
			"Incremental cache between builds",
		],
	},
	{
		name: "Cloud",
		price: "Coming soon",
		tagline: "Hosted previews, analytics, and collaboration.",
		highlighted: false,
		cta: {
			label: "Join the waitlist",
			href: "https://github.com/kanakkholwal/docvia",
			variant: "outline" as const,
		},
		features: [
			"Everything in open source",
			"Hosted preview environments",
			"Branch-based deploys",
			"Built-in analytics",
			"Search-as-you-type at scale",
			"Team roles and permissions",
		],
	},
];
</script>

<section class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-16 max-w-2xl text-center">
			<Badge variant="accent" class="mb-4">Editions</Badge>
			<h2
				class="font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Open by default. Hosted on the way.
			</h2>
			<p class="mt-4 text-lg text-fg-muted">
				The compiler and every renderer is open source under MIT. A hosted
				edition is in development for teams who want previews and analytics
				without standing up their own infrastructure.
			</p>
		</div>

		<div class="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
			{#each editions as edition}
				<div
					class={`relative flex flex-col rounded-xl border p-8 ${edition.highlighted ? "border-accent/40 bg-accent-subtle/30" : "border-border bg-bg-subtle"}`}
				>
					{#if edition.highlighted}
						<div
							class="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-accent-fg"
						>
							Available now
						</div>
					{/if}

					<div class="flex items-center gap-2.5">
						{#if edition.highlighted}
							<Github class="h-5 w-5 text-accent" />
						{:else}
							<Cloud class="h-5 w-5 text-fg-muted" />
						{/if}
						<h3
							class="font-display text-xl font-semibold tracking-tight"
						>
							{edition.name}
						</h3>
					</div>

					<div class="mt-6">
						<div
							class="font-display text-3xl font-semibold tracking-tight"
						>
							{edition.price}
						</div>
						<p class="mt-1 text-sm text-fg-muted">{edition.tagline}</p>
					</div>

					<ul class="mt-8 flex-1 space-y-3 text-sm">
						{#each edition.features as feat}
							<li class="flex items-start gap-2.5">
								<Check
									class={`mt-0.5 h-4 w-4 shrink-0 ${edition.highlighted ? "text-accent" : "text-fg-muted"}`}
								/>
								<span class="text-fg">{feat}</span>
							</li>
						{/each}
					</ul>

					<Button
						variant={edition.cta.variant}
						class="mt-8 w-full"
						href={edition.cta.href}
					>
						{edition.cta.label}
					</Button>
				</div>
			{/each}
		</div>
	</div>
</section>
