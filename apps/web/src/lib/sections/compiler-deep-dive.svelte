<script lang="ts">
import CodeSample from "$lib/components/code-sample.svelte";
import { type SnippetName, snippets } from "$lib/snippets";
import { cn } from "$lib/utils";
import { ArrowRight } from "@lucide/svelte";
import { cubicOut } from "svelte/easing";
import { fade } from "svelte/transition";

// React and Svelte side by side: the same compiled IR, two adapters.
const files = [
	"config.ts",
	"schema.ts",
	"page.tsx",
	"page.svelte",
] as const satisfies readonly SnippetName[];
let active = $state<SnippetName>("config.ts");

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

</script>

<section id="how-it-works" class="border-b border-hairline bg-surface-soft scroll-mt-20">
	<div
		class="mx-auto grid max-w-page gap-14 px-5 py-14 sm:px-10 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-12"
	>
		<div>
			<span class="label-meta">The pipeline</span>
			<h2
				class="mt-4 font-display text-[32px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-[48px] sm:leading-none"
			>
				A compiler, not a renderer.
			</h2>
			<p class="mt-6 max-w-xl text-[18px] leading-7 text-body">
				docvia treats your docs the way a modern bundler treats source code:
				hash, transform, cache, emit. Six stages, parallelized across cores,
				gated by a content-addressable cache.
			</p>

			<ol class="mt-10 space-y-4">
				{#each stages as stage, i}
					<li class="flex items-start gap-4">
						<span
							class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-hairline bg-surface-card font-mono text-[11px] font-semibold text-muted"
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
				href="/docs/guide/architecture"
				class="group mt-10 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-ink underline underline-offset-4 transition-colors duration-(--motion-fast) ease-out hover:text-brand-hover"
			>
				Read the architecture overview
				<ArrowRight
					class="h-4 w-4 transition-transform duration-(--motion-fast) ease-out group-hover:translate-x-0.5"
				/>
			</a>
		</div>

		<!-- Code window. The tabs used to be three buttons that switched nothing. -->
		<div class="overflow-hidden rounded-md border border-hairline bg-canvas">
			<div
				role="tablist"
				aria-label="Example files"
				class="flex items-center border-b border-hairline bg-surface-card px-2 text-[12px]"
			>
				{#each files as file (file)}
					<button
						role="tab"
						aria-selected={active === file}
						onclick={() => (active = file)}
						class={cn(
							"flex items-center gap-1.5 px-3 py-2 font-mono transition-colors duration-(--motion-fast) ease-out",
							active === file
								? "border-x border-hairline bg-canvas text-ink first:border-l-0"
								: "text-muted hover:text-ink",
						)}
					>
						{#if active === file}
							<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
						{/if}
						{file}
					</button>
				{/each}
			</div>

			<!-- Keyed so the panel crossfades on switch: the change of state is the
			     point, and without it the swap reads as a glitch. -->
			{#key active}
				<div in:fade={{ duration: 140, easing: cubicOut }}>
					<CodeSample name={active} />
				</div>
			{/key}

			<div
				class="flex items-center justify-between border-t border-hairline bg-surface-card px-4 py-2 font-mono text-[11px] text-muted"
			>
				<span>{snippets[active].lang} · {snippets[active].code.split("\n").length} lines</span>
				<!-- States the framework story without another paragraph of prose. -->
				<span class="flex items-center gap-1.5">
					<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
					react · svelte · any adapter
				</span>
			</div>
		</div>
	</div>
</section>
