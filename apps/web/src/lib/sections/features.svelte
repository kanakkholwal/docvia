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

<section id="features" class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<!-- Section head -->
		<div class="mb-16 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-widest text-muted"
			>
				Why docvia
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-[56px] lg:leading-[1.05]"
				style="letter-spacing: -0.03em;"
			>
				Every advantage hosted docs platforms can't ship.
			</h2>
			<p class="mt-6 max-w-2xl text-lg leading-[1.55] text-body">
				Cloud-locked competitors trade your deployment choice and framework
				choice for a polished theme. docvia gives you the polish and the
				choice.
			</p>
		</div>

		<!-- 6-card saturated cycle: pink → teal → lavender → peach → ochre → cream -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- 1. Pink — Framework-agnostic (text-card-on-dark) -->
			<article
				class="flex flex-col gap-5 rounded-xl bg-brand-pink p-8 text-card-on-dark"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-card-on-dark/80"
				>
					01 · Framework-agnostic
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Render the same docs to any framework.
				</h3>
				<p class="text-[15px] leading-[1.55] text-card-on-dark/85">
					IR-based compiler emits framework-native modules. React today,
					Svelte tomorrow, Vue when you need it — same source.
				</p>
				<!-- Product UI fragment: render-target tabs -->
				<div class="mt-auto flex flex-wrap gap-1.5 pt-2">
					{#each renderTargets as t}
						<span
							class={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
								t.active
									? "bg-white text-card-on-light"
									: "bg-white/15 text-card-on-dark"
							}`}
						>
							{t.label}
						</span>
					{/each}
				</div>
			</article>

			<!-- 2. Teal — Deploy anywhere (text-card-on-dark) -->
			<article
				class="flex flex-col gap-5 rounded-xl bg-brand-teal p-8 text-card-on-dark"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-brand-mint"
				>
					02 · Deploy anywhere
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Static output. Any host. Your VPC.
				</h3>
				<p class="text-[15px] leading-[1.55] text-card-on-dark/85">
					No proprietary runtime, no required cloud. Drop the build artifact
					on Vercel, Cloudflare, an S3 bucket, or your own infrastructure.
				</p>
				<!-- Product UI fragment: deploy target list -->
				<ul class="mt-auto space-y-1.5 text-[14px] text-card-on-dark/90">
					{#each deployTargets as host}
						<li class="flex items-center gap-2">
							<Check class="h-3.5 w-3.5 shrink-0 text-brand-mint" />
							{host}
						</li>
					{/each}
				</ul>
			</article>

			<!-- 3. Lavender — Typed frontmatter (text-card-on-light) -->
			<article
				class="flex flex-col gap-5 rounded-xl bg-brand-lavender p-8 text-card-on-light"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-card-on-light/70"
				>
					03 · Typed frontmatter
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Your schema. Your types. Auto-generated.
				</h3>
				<p class="text-[15px] leading-[1.55] text-card-on-light/75">
					Define frontmatter with Zod once. docvia emits a typed Frontmatter
					interface for every collection — caught at build, not at runtime.
				</p>
				<!-- Product UI fragment: code snippet (absolute dark terminal style) -->
				<pre
					class="mt-auto overflow-hidden rounded-md bg-[#0a0a0a] p-4 font-mono text-[12.5px] leading-[1.55] text-card-on-dark"
				>
<span class="text-brand-mint">type</span> <span class="text-brand-peach">Frontmatter</span> = {`{`}
  title: <span class="text-brand-mint">string</span>;
  tags: <span class="text-brand-mint">string</span>[];
  publishedAt: <span class="text-brand-mint">Date</span>;
{`}`}</pre>
			</article>

			<!-- 4. Peach — Incremental builds (text-card-on-light) -->
			<article
				class="flex flex-col gap-5 rounded-xl bg-brand-peach p-8 text-card-on-light"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-card-on-light/70"
				>
					04 · Incremental builds
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Rebuild changed pages. Skip everything else.
				</h3>
				<p class="text-[15px] leading-[1.55] text-card-on-light/75">
					Content-addressable cache keyed on source, frontmatter, config, and
					plugin state. Unchanged files take fractions of a millisecond.
				</p>
				<!-- Product UI fragment: cache log (absolute white inner panel) -->
				<div
					class="mt-auto space-y-1.5 rounded-md bg-white/75 p-3 font-mono text-[12px]"
				>
					{#each cacheLog as line}
						<div class="flex items-center gap-2">
							<span
								class={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
									line.state === "cached"
										? "bg-brand-teal text-card-on-dark"
										: "bg-[#0a0a0a] text-card-on-dark"
								}`}
							>
								{line.state}
							</span>
							<span class="flex-1 text-card-on-light/80">{line.file}</span>
							<span class="text-card-on-light/50">{line.ms}</span>
						</div>
					{/each}
				</div>
			</article>

			<!-- 5. Ochre — Pluggable pipeline (text-card-on-light) -->
			<article
				class="flex flex-col gap-5 rounded-xl bg-brand-ochre p-8 text-card-on-light"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-card-on-light/70"
				>
					05 · Pluggable pipeline
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Five hooks. Yours to extend.
				</h3>
				<p class="text-[15px] leading-[1.55] text-card-on-light/75">
					Tap into the compiler at any stage. Add OpenAPI rendering, link
					checking, or your own AST transforms without forking.
				</p>
				<!-- Product UI fragment: hook chain (absolute dark numerals) -->
				<div class="mt-auto flex flex-col gap-1.5">
					{#each hooks as hook, i}
						<div class="flex items-center gap-2 font-mono text-[12px]">
							<span
								class="grid h-5 w-5 place-items-center rounded-full bg-[#0a0a0a] text-[10px] font-bold text-card-on-dark"
							>
								{i + 1}
							</span>
							<span class="text-card-on-light/85">{hook}()</span>
						</div>
					{/each}
				</div>
			</article>

			<!-- 6. Cream — Search + AI (uses theme-flipping surface-card → text-ink) -->
			<article
				class="flex flex-col gap-5 rounded-xl border border-hairline bg-surface-card p-8 text-ink"
			>
				<span
					class="text-[12px] font-semibold uppercase tracking-widest text-muted"
				>
					06 · Search + BYO AI
				</span>
				<h3
					class="font-display text-[28px] leading-[1.1] md:text-[32px]"
					style="letter-spacing: -0.02em;"
				>
					Fast local search. Your AI keys.
				</h3>
				<p class="text-[15px] leading-[1.55] text-body">
					Section-level Orama indexing ships client-side. Add semantic search
					with your own Claude or OpenAI key — no per-credit metering.
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
							<Zap class="h-3 w-3 text-brand-ochre" />
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
