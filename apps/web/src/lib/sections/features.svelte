<script lang="ts">
import CodeSample from "$lib/components/code-sample.svelte";
import { Check, Search } from "@lucide/svelte";

// Renderers, not integrations: Vite and Next.js are how docvia runs, not
// what it renders to.
const renderTargets = [
	{ label: "React", active: true },
	{ label: "Svelte", active: false },
	{ label: "Your adapter", active: false },
];

const deployTargets = [
	"Vercel",
	"Cloudflare Pages",
	"Netlify",
	"AWS S3 + CDN",
	"Fly.io",
	"Self-host",
];

// Shows the cache decision, not timings. The millisecond figures that used
// to be here were invented, and nothing benchmarks them.
const cacheLog = [
	{ file: "intro.md", state: "cached", reason: "hash match" },
	{ file: "config.md", state: "rebuilt", reason: "source changed" },
	{ file: "api.md", state: "cached", reason: "hash match" },
	{ file: "guides.md", state: "cached", reason: "hash match" },
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
				One source, one IR. React and Svelte ship first-party; any other
				framework needs an adapter, not a rewrite.
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
				No proprietary runtime, no required cloud. The output is static files.
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
				Define it once with Zod. docvia generates the matching interface per
				collection, so a bad field fails the build.
			</p>
			<CodeSample name="frontmatter" class="mt-auto" />
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
				The key covers source, frontmatter, config, and plugin state. Change
				one and only the affected pages recompile.
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
						<span class="text-muted">{line.reason}</span>
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
				Tap any stage of the pipeline. OpenAPI rendering, Mermaid diagrams, and
				syntax highlighting are all just plugins.
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

		<!-- 6. Search -->
		<article class={cell}>
			<span class="label-meta">
				<span class="text-ink">06</span> · Search
			</span>
			<h3
				class="font-display text-[24px] leading-[1.1667] text-ink"
			>
				Full-text search, indexed by section
			</h3>
			<p class="text-[16px] leading-[1.75] text-body">
				Orama indexes every heading with its body. Run it on the server for a
				zero-payload index, or ship a static one to the client.
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
