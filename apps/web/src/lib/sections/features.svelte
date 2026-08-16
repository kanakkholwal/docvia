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

const card =
	"group flex flex-col gap-5 rounded-md border border-hairline bg-surface-soft p-6 transition-colors duration-(--motion-base) ease-out hover:border-hairline-strong md:p-8";
</script>

<section id="features" class="border-b border-hairline bg-canvas scroll-mt-16">
	<div class="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
		<div class="mb-14 max-w-3xl">
			<span class="label-meta">Features</span>
			<h2
				class="mt-4 font-display text-[36px] text-ink md:text-[48px]"
				style="line-height: 1.05; letter-spacing: -0.04em;"
			>
				Everything you need to compile docs.
			</h2>
			<p class="mt-6 max-w-2xl text-[18px] leading-[1.56] text-body">
				Typed frontmatter, incremental builds, framework-native output, and
				local search, resolved at build time and entirely yours to own.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- 1. Framework-agnostic -->
			<article class={card}>
				<span class="label-meta">
					<span class="text-brand-ink">01</span> · Framework-agnostic
				</span>
				<h3
					class="font-display text-[24px] text-ink md:text-[28px]"
					style="line-height: 1.15; letter-spacing: -0.03em;"
				>
					Render the same docs to any framework.
				</h3>
				<p class="text-[15px] leading-[1.6] text-body">
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
			<article class={card}>
				<span class="label-meta">
					<span class="text-brand-ink">02</span> · Deploy anywhere
				</span>
				<h3
					class="font-display text-[24px] text-ink md:text-[28px]"
					style="line-height: 1.15; letter-spacing: -0.03em;"
				>
					Static output. Any host. Your VPC.
				</h3>
				<p class="text-[15px] leading-[1.6] text-body">
					No proprietary runtime, no required cloud. Drop the build artifact on
					Vercel, Cloudflare, an S3 bucket, or your own infrastructure.
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
			<article class={card}>
				<span class="label-meta">
					<span class="text-brand-ink">03</span> · Typed frontmatter
				</span>
				<h3
					class="font-display text-[24px] text-ink md:text-[28px]"
					style="line-height: 1.15; letter-spacing: -0.03em;"
				>
					Your schema. Your types. Auto-generated.
				</h3>
				<p class="text-[15px] leading-[1.6] text-body">
					Define frontmatter with Zod once. docvia emits a typed Frontmatter
					interface for every collection, caught at build, not at runtime.
				</p>
				<pre
					class="mt-auto overflow-x-auto rounded-md border border-hairline bg-canvas p-4 font-mono text-[12.5px] leading-[1.6] text-ink"
				>
<span class="text-brand-ink">type</span> Frontmatter = {`{`}
  title: <span class="text-brand-ink">string</span>;
  tags: <span class="text-brand-ink">string</span>[];
  publishedAt: <span class="text-brand-ink">Date</span>;
{`}`}</pre>
			</article>

			<!-- 4. Incremental builds -->
			<article class={card}>
				<span class="label-meta">
					<span class="text-brand-ink">04</span> · Incremental builds
				</span>
				<h3
					class="font-display text-[24px] text-ink md:text-[28px]"
					style="line-height: 1.15; letter-spacing: -0.03em;"
				>
					Rebuild changed pages. Skip everything else.
				</h3>
				<p class="text-[15px] leading-[1.6] text-body">
					Content-addressable cache keyed on source, frontmatter, config, and
					plugin state. Unchanged files take fractions of a millisecond.
				</p>
				<div
					class="mt-auto space-y-1.5 rounded-md border border-hairline bg-canvas p-3 font-mono text-[12px]"
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
			<article class={card}>
				<span class="label-meta">
					<span class="text-brand-ink">05</span> · Pluggable pipeline
				</span>
				<h3
					class="font-display text-[24px] text-ink md:text-[28px]"
					style="line-height: 1.15; letter-spacing: -0.03em;"
				>
					Five hooks. Yours to extend.
				</h3>
				<p class="text-[15px] leading-[1.6] text-body">
					Tap into the compiler at any stage. Add OpenAPI rendering, link
					checking, or your own AST transforms without forking.
				</p>
				<div class="mt-auto flex flex-col gap-1.5">
					{#each hooks as hook, i}
						<div class="flex items-center gap-2.5 font-mono text-[12px]">
							<span
								class="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-ink"
							>
								{i + 1}
							</span>
							<span class="text-body-strong">{hook}()</span>
						</div>
					{/each}
				</div>
			</article>

			<!-- 6. Search + BYO AI -->
			<article class={card}>
				<span class="label-meta">
					<span class="text-brand-ink">06</span> · Search + BYO AI
				</span>
				<h3
					class="font-display text-[24px] text-ink md:text-[28px]"
					style="line-height: 1.15; letter-spacing: -0.03em;"
				>
					Fast local search. Your AI keys.
				</h3>
				<p class="text-[15px] leading-[1.6] text-body">
					Section-level Orama indexing ships client-side. Add semantic search
					with your own Claude or OpenAI key. No per-credit metering.
				</p>
				<div
					class="mt-auto overflow-hidden rounded-md border border-hairline bg-canvas"
				>
					<div class="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
						<Search class="h-4 w-4 text-muted" />
						<span class="font-mono text-[13px] text-body-strong">
							incremental builds
						</span>
						<span
							class="ml-auto inline-flex items-center gap-1 rounded-sm bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink"
						>
							<Zap class="h-3 w-3" />
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
