<script lang="ts">
import { Check, Search, Zap } from "@lucide/svelte";

const renderTargets = [
	{ label: "React", active: true },
	{ label: "Svelte", active: false },
	{ label: "Vite", active: false },
	{ label: "Next.js", active: false },
];

const deployTargets = [
	"Vercel",
	"Cloudflare Pages",
	"Netlify",
	"AWS S3 + CDN",
	"Fly.io",
	"Self-host",
];

const cacheLog = [
	{ file: "intro.md", state: "cached", ms: "0.4ms" },
	{ file: "config.md", state: "rebuilt", ms: "31ms" },
	{ file: "api.md", state: "cached", ms: "0.3ms" },
	{ file: "guides.md", state: "cached", ms: "0.3ms" },
];

const hooks = [
	"beforeParse",
	"afterParse",
	"beforeTransform",
	"afterTransform",
	"beforeRender",
];
</script>

<section id="features" class="border-b border-hairline bg-canvas scroll-mt-16">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<!-- Section head -->
		<div class="mb-16 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-widest text-muted"
			>
				Features
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-display-2 lg:leading-[1.05]"
			>
				Everything you need to compile docs.
			</h2>
			<p class="mt-6 max-w-2xl text-lg leading-[1.55] text-body">
				Typed frontmatter, incremental builds, framework-native output, and
				local search, resolved at build time and entirely yours to own.
			</p>
		</div>

		<!-- Bordered panel grid — hairline gridlines via gap-px over a
		     hairline-colored track. One brand voltage per panel. -->
		<div
			class="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2"
		>
			<!-- 1. Framework-agnostic -->
			<article
				class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					<span class="text-brand-ink">01</span> · Framework-agnostic
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Render the same docs to any framework.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					IR-based compiler emits framework-native modules. React and
					Svelte today, more adapters as you need them. Same source.
				</p>
				<!-- Product UI fragment: render-target tabs -->
				<div class="mt-auto flex flex-wrap gap-1.5 pt-2">
					{#each renderTargets as t}
						<span
							class={`rounded-md px-3 py-1.5 text-[13px] font-medium ${
								t.active
									? "bg-brand text-on-brand"
									: "bg-surface-strong text-body"
							}`}
						>
							{t.label}
						</span>
					{/each}
				</div>
			</article>

			<!-- 2. Deploy anywhere -->
			<article
				class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					<span class="text-brand-ink">02</span> · Deploy anywhere
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Static output. Any host. Your VPC.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					No proprietary runtime, no required cloud. Drop the build artifact
					on Vercel, Cloudflare, an S3 bucket, or your own infrastructure.
				</p>
				<!-- Product UI fragment: deploy target list -->
				<ul class="mt-auto space-y-1.5 text-[14px] text-body-strong">
					{#each deployTargets as host}
						<li class="flex items-center gap-2">
							<Check class="h-3.5 w-3.5 shrink-0 text-check" />
							{host}
						</li>
					{/each}
				</ul>
			</article>

			<!-- 3. Typed frontmatter -->
			<article
				class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					<span class="text-brand-ink">03</span> · Typed frontmatter
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Your schema. Your types. Auto-generated.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					Define frontmatter with Zod once. docvia emits a typed Frontmatter
					interface for every collection, caught at build, not at runtime.
				</p>
				<!-- Product UI fragment: code snippet (embedded dark terminal) -->
				<pre
					class="mt-auto overflow-hidden rounded-md bg-surface-dark p-4 font-mono text-[12.5px] leading-[1.55] text-card-on-dark"
				>
<span class="text-brand">type</span> <span class="text-card-on-dark">Frontmatter</span> = {`{`}
  title: <span class="text-brand">string</span>;
  tags: <span class="text-brand">string</span>[];
  publishedAt: <span class="text-brand">Date</span>;
{`}`}</pre>
			</article>

			<!-- 4. Incremental builds -->
			<article
				class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					<span class="text-brand-ink">04</span> · Incremental builds
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Rebuild changed pages. Skip everything else.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					Content-addressable cache keyed on source, frontmatter, config, and
					plugin state. Unchanged files take fractions of a millisecond.
				</p>
				<!-- Product UI fragment: cache log -->
				<div
					class="mt-auto space-y-1.5 rounded-md border border-hairline bg-surface-soft p-3 font-mono text-[12px]"
				>
					{#each cacheLog as line}
						<div class="flex items-center gap-2">
							<span
								class={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
									line.state === "cached"
										? "bg-brand text-on-brand"
										: "bg-surface-dark text-card-on-dark"
								}`}
							>
								{line.state}
							</span>
							<span class="flex-1 text-body">{line.file}</span>
							<span class="text-muted-soft">{line.ms}</span>
						</div>
					{/each}
				</div>
			</article>

			<!-- 5. Pluggable pipeline -->
			<article
				class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					<span class="text-brand-ink">05</span> · Pluggable pipeline
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Five hooks. Yours to extend.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					Tap into the compiler at any stage. Add OpenAPI rendering, link
					checking, or your own AST transforms without forking.
				</p>
				<!-- Product UI fragment: hook chain -->
				<div class="mt-auto flex flex-col gap-1.5">
					{#each hooks as hook, i}
						<div class="flex items-center gap-2 font-mono text-[12px]">
							<span
								class="grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-on-brand"
							>
								{i + 1}
							</span>
							<span class="text-body-strong">{hook}()</span>
						</div>
					{/each}
				</div>
			</article>

			<!-- 6. Search + BYO AI -->
			<article
				class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					<span class="text-brand-ink">06</span> · Search + BYO AI
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Fast local search. Your AI keys.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					Section-level Orama indexing ships client-side. Add semantic search
					with your own Claude or OpenAI key. No per-credit metering.
				</p>
				<!-- Product UI fragment: search bar with results -->
				<div
					class="mt-auto overflow-hidden rounded-md border border-hairline bg-canvas"
				>
					<div
						class="flex items-center gap-2 border-b border-hairline px-3 py-2.5"
					>
						<Search class="h-4 w-4 text-muted" />
						<span class="font-mono text-[13px] text-body-strong">
							incremental builds
						</span>
						<span
							class="ml-auto inline-flex items-center gap-1 rounded-md bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted"
						>
							<Zap class="h-3 w-3 text-brand-ink" />
							AI
						</span>
					</div>
					<div class="space-y-2 px-3 py-3 text-[13px]">
						<div>
							<div class="font-medium text-ink">Incremental cache</div>
							<div class="text-muted">Content-addressable hashing skips…</div>
						</div>
						<div>
							<div class="font-medium text-ink">Build performance</div>
							<div class="text-muted">DAG-based rebuilds for…</div>
						</div>
					</div>
				</div>
			</article>
		</div>
	</div>
</section>
