<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import { ArrowRight, FileCode2 } from "@lucide/svelte";

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
import {
  createReactRenderer,
  createShikiHighlighter,
} from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["typescript", "bash", "json"],
    }),
  }),
});`;
</script>

<section class="border-t border-border/60 bg-bg-subtle/30">
	<div
		class="mx-auto grid max-w-[1200px] gap-16 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-2 lg:items-center lg:gap-12"
	>
		<div>
			<Badge variant="accent" class="mb-4">
				<FileCode2 class="h-3 w-3" />
				The pipeline
			</Badge>
			<h2
				class="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
			>
				A compiler, not a renderer.
			</h2>
			<p class="mt-4 max-w-xl text-lg leading-relaxed text-fg-muted">
				docvia treats your docs the way a modern bundler treats source code:
				hash, transform, cache, emit. Six stages, parallelized across cores,
				gated by a content-addressable cache.
			</p>

			<ol class="mt-10 space-y-4">
				{#each stages as stage, i}
					<li class="flex items-start gap-4">
						<span
							class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-bg font-mono text-xs font-medium text-fg-muted"
						>
							{String(i + 1).padStart(2, "0")}
						</span>
						<div>
							<div
								class="font-display text-base font-medium tracking-tight"
							>
								{stage.name}
							</div>
							<div class="text-sm text-fg-muted">{stage.body}</div>
						</div>
					</li>
				{/each}
			</ol>

			<a
				href="/docs"
				class="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
			>
				Read the architecture overview
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>

		<!-- Code window with tabs -->
		<div
			class="overflow-hidden rounded-xl border border-border bg-bg-subtle shadow-[var(--shadow-md)]"
		>
			<div
				class="flex items-center border-b border-border bg-bg-muted/30 px-2 text-xs"
			>
				<button
					class="flex items-center gap-1.5 border-r border-border bg-bg-subtle px-3 py-2 font-mono text-fg"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
					docvia.config.ts
				</button>
				<button
					class="px-3 py-2 font-mono text-fg-muted hover:text-fg"
				>
					schema.ts
				</button>
				<button
					class="px-3 py-2 font-mono text-fg-muted hover:text-fg"
				>
					app.tsx
				</button>
			</div>
			<pre
				class="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-fg"><code>{codeConfig}</code></pre>
			<div
				class="flex items-center justify-between border-t border-border bg-bg-muted/20 px-4 py-2 text-[11px] font-mono text-fg-subtle"
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
