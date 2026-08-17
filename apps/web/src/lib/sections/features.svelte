<script lang="ts">
import { Check, Search } from "@lucide/svelte";

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

// vite.dev uses zero cards: cells are full-bleed, separated by 1px dividers.
const cell = "flex flex-col gap-5 bg-canvas p-5 sm:p-10";
</script>

<section id="features" class="border-b border-hairline bg-canvas scroll-mt-20">
	<div class="mx-auto max-w-page px-5 py-14 text-center sm:px-10 sm:py-28">
		<span class="label-meta">Features</span>
		<h2
			class="mx-auto mt-4 max-w-2xl text-balance font-display text-[32px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-[48px] sm:leading-none"
		>
			Everything you need to compile docs.
		</h2>
		<p class="mx-auto mt-6 max-w-2xl text-[18px] leading-7 text-body">
			Typed frontmatter, incremental builds, framework-native output, and local
			search, resolved at build time and entirely yours to own.
		</p>
	</div>

	<!-- Full-bleed grid: vite.dev puts the heading and the grid in separate
	     sections so the cells run edge to edge with no outer padding. -->
	<div
		class="mx-auto grid max-w-page grid-cols-1 gap-px border-t border-hairline bg-hairline md:grid-cols-2"
	>
		<!-- 1. Framework-agnostic -->
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">01</span> · Framework-agnostic
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Render the same docs to any framework.
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				IR-based compiler emits framework-native modules. React and Svelte
				today, more adapters as you need them. Same source.
			</p>
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
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">02</span> · Deploy anywhere
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Deploy the build artifact anywhere
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				There is no proprietary runtime and no required cloud. Drop the build
				artifact on Vercel, Cloudflare, an S3 bucket, or your own boxes.
			</p>
			<ul class="mt-auto grid grid-cols-2 gap-1.5 text-[14px] text-body-strong">
				{#each deployTargets as host}
					<li class="flex items-center gap-2">
						<Check class="h-3.5 w-3.5 shrink-0 text-check" />
						{host}
					</li>
				{/each}
			</ul>
		</article>

		<!-- 3. Typed frontmatter -->
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">03</span> · Typed frontmatter
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Frontmatter types generated from your Zod schema
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				Define frontmatter with Zod once. docvia emits a typed Frontmatter
				interface for every collection, caught at build, not at runtime.
			</p>
			<pre
				class="mt-auto overflow-x-auto rounded-md border border-hairline bg-surface-soft p-4 font-mono text-[12.5px] leading-[1.6] text-ink"
			>
<span class="text-brand-ink">type</span> Frontmatter = {`{`}
  title: <span class="text-body-strong">string</span>;
  tags: <span class="text-body-strong">string</span>[];
  publishedAt: <span class="text-body-strong">Date</span>;
{`}`}</pre>
		</article>

		<!-- 4. Incremental builds -->
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">04</span> · Incremental builds
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Incremental rebuilds gated by a content hash
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				Content-addressable cache keyed on source, frontmatter, config, and
				plugin state. Unchanged files take fractions of a millisecond.
			</p>
			<div
				class="mt-auto space-y-1.5 rounded-md border border-hairline bg-surface-soft p-3 font-mono text-[12px]"
			>
				{#each cacheLog as line}
					<div class="flex items-center gap-2">
						<span
							class={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
								line.state === "cached"
									? "bg-brand text-on-brand"
									: "bg-surface-strong text-body-strong"
							}`}
						>
							{line.state}
						</span>
						<span class="flex-1 text-body">{line.file}</span>
						<span class="text-muted">{line.ms}</span>
					</div>
				{/each}
			</div>
		</article>

		<!-- 5. Pluggable pipeline -->
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">05</span> · Pluggable pipeline
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Five hooks. Yours to extend.
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				Tap into the compiler at any stage. Add OpenAPI rendering, link
				checking, or your own AST transforms without forking.
			</p>
			<div class="mt-auto flex flex-col gap-1.5">
				{#each hooks as hook, i}
					<div class="flex items-center gap-2.5 font-mono text-[12px]">
						<span
							class="grid h-5 w-5 place-items-center rounded-full bg-surface-strong text-[10px] font-semibold text-body-strong"
						>
							{i + 1}
						</span>
						<span class="text-body-strong">{hook}()</span>
					</div>
				{/each}
			</div>
		</article>

		<!-- 6. Search + BYO AI -->
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">06</span> · Search + BYO AI
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Client-side search with optional semantic ranking
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				Section-level Orama indexing ships client-side. Add semantic search
				with your own Claude or OpenAI key. No per-credit metering.
			</p>
			<div
				class="mt-auto overflow-hidden rounded-md border border-hairline bg-surface-soft"
			>
				<div class="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
					<Search class="h-4 w-4 text-muted" />
					<span class="font-mono text-[13px] text-body-strong">
						incremental builds
					</span>
					<span
						class="ml-auto inline-flex items-center gap-1 rounded-sm bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink"
					>
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
</section>
