<script lang="ts">
import { ArrowRight } from "@lucide/svelte";

const stages = [
	{
		name: "Read",
		body: "Parallel directory walk, xxhash content fingerprints",
	},
	{ name: "Parse", body: "remark + rehype with cached processor" },
	{ name: "Sanitize", body: "Strict allow-list; scripts and iframes blocked" },
	{ name: "Transform", body: "Single-pass DFS into framework-agnostic IR" },
	{ name: "Cache", body: "Composite hash gates per-file work" },
	{ name: "Render", body: "Per-renderer adapter emits typed module graph" },
];

const codeConfig = `import { defineConfig } from "@docvia/cli";
import { createReactRenderer } from "@docvia/renderer-react";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [
    shiki({ theme: "github-dark", langs: ["typescript", "bash", "json"] }),
  ],
});`;
</script>

<section id="how-it-works" class="border-b border-hairline bg-surface-soft scroll-mt-16">
	<div
		class="mx-auto grid max-w-7xl gap-14 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-12"
	>
		<div>
			<span class="label-meta">The pipeline</span>
			<h2
				class="mt-4 font-display text-[36px] text-ink md:text-[48px]"
				style="line-height: 1.05; letter-spacing: -0.04em;"
			>
				A compiler, not a renderer.
			</h2>
			<p class="mt-6 max-w-xl text-[18px] leading-[1.56] text-body">
				docvia treats your docs the way a modern bundler treats source code:
				hash, transform, cache, emit. Six stages, parallelized across cores,
				gated by a content-addressable cache.
			</p>

			<ol class="mt-10 space-y-4">
				{#each stages as stage, i}
					<li class="flex items-start gap-4">
						<span
							class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-hairline bg-surface-card font-mono text-[11px] font-semibold text-brand-ink"
						>
							{String(i + 1).padStart(2, "0")}
						</span>
						<div>
							<div class="text-[16px] font-medium leading-[1.22] text-ink">
								{stage.name}
							</div>
							<div class="mt-0.5 text-[14px] leading-[1.6] text-body">
								{stage.body}
							</div>
						</div>
					</li>
				{/each}
			</ol>

			<a
				href="https://docs.docvia.dev/guide/architecture"
				class="group mt-10 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-ink underline underline-offset-4 transition-colors duration-(--motion-fast) ease-out hover:text-brand-strong"
			>
				Read the architecture overview
				<ArrowRight
					class="h-4 w-4 transition-transform duration-(--motion-fast) ease-out group-hover:translate-x-0.5"
				/>
			</a>
		</div>

		<!-- Code window -->
		<div class="overflow-hidden rounded-md border border-hairline bg-canvas">
			<div
				class="flex items-center border-b border-hairline bg-surface-card px-2 text-[12px]"
			>
				<button
					class="flex items-center gap-1.5 border-r border-hairline bg-canvas px-3 py-2 font-mono text-ink"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
					docvia.config.ts
				</button>
				<button
					class="px-3 py-2 font-mono text-muted transition-colors duration-(--motion-fast) ease-out hover:text-ink"
				>
					schema.ts
				</button>
				<button
					class="px-3 py-2 font-mono text-muted transition-colors duration-(--motion-fast) ease-out hover:text-ink"
				>
					app.tsx
				</button>
			</div>
			<pre
				class="overflow-x-auto p-5 font-mono text-[13px] leading-[1.6] text-ink"><code>{codeConfig}</code></pre>
			<div
				class="flex items-center justify-between border-t border-hairline bg-surface-card px-4 py-2 text-[11px] font-mono text-muted"
			>
				<span>typescript · 18 lines</span>
				<span class="flex items-center gap-1.5">
					<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
					typed
				</span>
			</div>
		</div>
	</div>
</section>
