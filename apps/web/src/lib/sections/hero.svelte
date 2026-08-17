<script lang="ts">
import InstallCommand from "$lib/components/install-command.svelte";
import PipelineStack from "$lib/components/pipeline-stack.svelte";
import { Button } from "$lib/components/ui/button";
import { ArrowRight, Check, Github } from "@lucide/svelte";

const guarantees = ["MIT licensed", "Self-host or BYO cloud", "No vendor lock-in"];
</script>


<section class="relative overflow-hidden border-b border-hairline bg-canvas">

	<div class="relative mx-auto grid max-w-page lg:grid-cols-2">
		<div
			class="flex flex-col px-5 py-14 sm:px-10 sm:py-20 lg:border-r lg:border-hairline"
		>
			<a
				href="https://github.com/kanakkholwal/docvia/releases"
				class="reveal group label-meta inline-flex w-fit items-center gap-2 transition-colors duration-(--motion-fast) ease-out hover:text-ink"
				style="animation-delay: 0ms"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
				What's new
				<ArrowRight
					class="h-3 w-3 transition-transform duration-(--motion-fast) ease-out group-hover:translate-x-0.5"
				/>
			</a>

			<h1
				class="reveal mt-4 max-w-104 font-display text-[40px] leading-[1.12] tracking-tighter text-ink sm:text-5xl md:text-[60px]"
				style="animation-delay: 40ms"
			>
				The build tool for your docs.
			</h1>

			<p
				class="reveal mt-3 max-w-md text-[18px] leading-7 text-body"
				style="animation-delay: 80ms"
			>
				docvia compiles Markdown into typed, pre-rendered modules for React,
				Svelte, and any framework with an adapter. Nothing parses at runtime.
			</p>

			<div
				class="reveal mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
				style="animation-delay: 120ms"
			>
				<Button href="/docs" class="cta-glow">
					Get started
					<ArrowRight />
				</Button>
				<Button variant="outline" href="https://github.com/kanakkholwal/docvia">
					<Github />
					View on GitHub
				</Button>
			</div>

			<div
				class="reveal mt-8 w-full max-w-md pt-8"
				style="animation-delay: 160ms"
			>
				<InstallCommand pkg="@docvia/cli" />
			</div>

			<ul
				class="reveal mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-muted"
				style="animation-delay: 200ms"
			>
				{#each guarantees as item}
					<li class="inline-flex items-center gap-1.5">
						<Check class="h-4 w-4 text-check" />
						{item}
					</li>
				{/each}
			</ul>
		</div>

		<!-- ── Right: the compile pipeline as stacked layers ───────────── -->
		<div
			class="reveal flex items-center px-5 py-14 sm:px-10 sm:py-20"
			style="animation-delay: 200ms"
		>
			<PipelineStack />
		</div>
	</div>
</section>

<style>
	/* Entrance, CSS-driven so `prefers-reduced-motion` (handled globally in
	   app.css) neutralizes it, and content is present on first paint / no-JS. */
	.reveal {
		opacity: 0;
		animation: reveal-rise 0.5s var(--ease-out) forwards;
	}
	@keyframes reveal-rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			animation: none;
			transform: none;
		}
	}
</style>
