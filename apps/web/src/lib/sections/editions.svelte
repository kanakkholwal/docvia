<script lang="ts">
import { ArrowRight, Building2, Check, Cloud, Github } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

type Edition = {
	id: string;
	name: string;
	price: string;
	priceSuffix?: string;
	tagline: string;
	featured: boolean;
	icon: typeof Github;
	cta: { label: string; href: string };
	features: string[];
	footnote?: string;
};

const editions: Edition[] = [
	{
		id: "oss",
		name: "Open source",
		price: "Free",
		priceSuffix: "MIT licensed",
		tagline: "Self-host. Ship anywhere. Forever free.",
		featured: false,
		icon: Github,
		cta: { label: "Get started", href: "/docs" },
		features: [
			"Full compiler, CLI, and IR",
			"React, Svelte, Vite, Next.js renderers",
			"Section-level Orama search",
			"Pluggable pipeline with 5 hooks",
			"Incremental cache between builds",
			"Self-host anywhere — static, edge, VPC",
		],
	},
	{
		id: "team",
		name: "Team",
		price: "Waitlist",
		priceSuffix: "managed cloud · 2026",
		tagline: "Everything in OSS, plus managed builds and collaboration.",
		featured: true,
		icon: Cloud,
		cta: { label: "Join Team waitlist", href: "mailto:hello@docvia.dev?subject=Team%20waitlist" },
		features: [
			"Everything in Open source",
			"Hosted builds with custom domains",
			"Branch previews and PR deployments",
			"Built-in analytics and search insights",
			"BYO-key AI search and Q&A",
			"Team roles, SSO-lite, audit log",
		],
		footnote: "Per-seat pricing. No per-credit metering.",
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: "Custom",
		priceSuffix: "VPC · SSO · SLA",
		tagline: "Self-host the managed control plane on your infrastructure.",
		featured: false,
		icon: Building2,
		cta: { label: "Talk to us", href: "mailto:hello@docvia.dev?subject=Enterprise" },
		features: [
			"Everything in Team",
			"Deploy control plane to your VPC",
			"Full SSO (SAML, OIDC) + SCIM",
			"Data residency commitments",
			"Audit log export + retention SLAs",
			"Priority engineering support",
		],
	},
];
</script>

<section id="editions" class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<!-- Section head -->
		<div class="mb-16 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
			>
				Editions
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-[56px] lg:leading-[1.05]"
				style="letter-spacing: -0.03em;"
			>
				Open today. Hosted soon. Yours either way.
			</h2>
			<p class="mt-6 max-w-2xl text-lg leading-[1.55] text-body">
				The compiler and every renderer are MIT-licensed and self-hostable.
				Team and Enterprise add managed builds and governance on top of the
				same open core — never instead of it.
			</p>
		</div>

		<!-- Tiers -->
		<div class="grid gap-6 lg:grid-cols-3">
			{#each editions as edition}
				{@const isFeatured = edition.featured}
				<div
					class={`relative flex flex-col rounded-xl p-8 ${
						isFeatured
							? "bg-brand-teal text-card-on-dark"
							: "border border-hairline bg-surface-card text-ink"
					}`}
				>
					{#if isFeatured}
						<div
							class="absolute -top-3 left-8 rounded-full bg-brand-peach px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-card-on-light"
						>
							Most requested
						</div>
					{/if}

					<!-- Header -->
					<div class="flex items-center gap-2.5">
						<edition.icon
							class={`h-5 w-5 ${isFeatured ? "text-brand-mint" : "text-muted"}`}
						/>
						<h3
							class="font-display text-[22px]"
							style="letter-spacing: -0.02em;"
						>
							{edition.name}
						</h3>
					</div>

					<!-- Price -->
					<div class="mt-6">
						<div
							class="font-display text-[44px] leading-[1.05]"
							style="letter-spacing: -0.03em;"
						>
							{edition.price}
						</div>
						{#if edition.priceSuffix}
							<div
								class={`mt-1 text-[13px] font-medium uppercase tracking-[0.08em] ${
									isFeatured ? "text-brand-mint" : "text-muted"
								}`}
							>
								{edition.priceSuffix}
							</div>
						{/if}
						<p
							class={`mt-3 text-[14px] leading-[1.55] ${
								isFeatured ? "text-card-on-dark/85" : "text-body"
							}`}
						>
							{edition.tagline}
						</p>
					</div>

					<!-- Features -->
					<ul class="mt-7 flex-1 space-y-2.5 text-[14px]">
						{#each edition.features as feat}
							<li class="flex items-start gap-2.5">
								<Check
									class={`mt-0.5 h-4 w-4 shrink-0 ${
										isFeatured ? "text-brand-mint" : "text-check"
									}`}
								/>
								<span
									class={isFeatured ? "text-card-on-dark/90" : "text-body-strong"}
								>{feat}</span>
							</li>
						{/each}
					</ul>

					<!-- CTA -->
					<a
						href={edition.cta.href}
						class={`mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-[14px] font-semibold transition-colors ${
							isFeatured
								? "bg-white text-card-on-light hover:bg-white/90"
								: "bg-ink text-on-primary hover:bg-ink/90"
						}`}
					>
						{edition.cta.label}
						<ArrowRight class="h-4 w-4" />
					</a>

					{#if edition.footnote}
						<p
							class={`mt-3 text-center text-[12px] ${
								isFeatured ? "text-card-on-dark/70" : "text-muted"
							}`}
						>
							{edition.footnote}
						</p>
					{/if}
				</div>
			{/each}
		</div>

		<p class="mt-10 text-center text-[13px] text-muted">
			Open source is available today. Team and Enterprise are in active
			development — join the waitlist to shape what ships.
		</p>
	</div>
</section>
