<script lang="ts">
import { ArrowRight, Check, Github } from "@lucide/svelte";
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import InstallCommand from "$lib/components/install-command.svelte";

const buildLog = [
	{ label: "parse", detail: "docs/  ·  24 files", duration: "38ms" },
	{ label: "ir", detail: "transform → 312 nodes", duration: "21ms" },
	{ label: "react", detail: "emit .docvia/react", duration: "104ms" },
	{ label: "svelte", detail: "emit .docvia/svelte", duration: "98ms" },
	{ label: "static", detail: "emit .docvia/html", duration: "61ms" },
];

const targets = ["React", "Svelte", "Next.js", "Vite", "Astro", "Static"];

const guarantees = [
	"MIT licensed",
	"Self-host or BYO cloud",
	"No vendor lock-in",
];

const TOTAL = buildLog.length;

// The terminal "builds" on a loop so the hero reads as the compiler working,
// not a static screenshot. SSR + reduced-motion render the full log statically
// (animate stays false → shown = TOTAL), so there's no blank/first-paint gap.
let animate = $state(false);
let step = $state(TOTAL);
let showDone = $state(true);

const shown = $derived(animate ? step : TOTAL);
const doneVisible = $derived(animate ? showDone : true);

onMount(() => {
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduced) return; // keep the full log, static

	animate = true;
	let t: ReturnType<typeof setTimeout>;

	const stream = () => {
		if (step < TOTAL) {
			step += 1;
			t = setTimeout(stream, 360);
		} else {
			t = setTimeout(() => {
				showDone = true;
				t = setTimeout(reset, 2600); // hold the finished build, then loop
			}, 280);
		}
	};
	const reset = () => {
		step = 0;
		showDone = false;
		t = setTimeout(stream, 480);
	};

	// Start by holding the SSR-matching full log, then run the loop.
	t = setTimeout(reset, 2600);
	return () => clearTimeout(t);
});
</script>

<section class="relative overflow-hidden border-b border-hairline bg-canvas">
	<!-- Faint brand halo + grid floor — one scarce lime accent, static so
	     reduced-motion has nothing to disable. -->
	<div class="glow" aria-hidden="true"></div>
	<div class="grid-floor" aria-hidden="true"></div>

	<div
		class="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-20 md:px-10 md:pt-24 md:pb-28 lg:grid-cols-12 lg:gap-0"
	>
		<!-- ── Left: headline, CTA, install ─────────────────────────── -->
		<div class="flex flex-col lg:col-span-6 lg:border-r lg:border-hairline lg:pr-12">
			<a
				href="https://github.com/kanakkholwal/docvia/releases"
				class="reveal inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-surface-soft/80 px-3 py-1.5 text-[13px] font-medium text-body-strong backdrop-blur-sm transition-colors hover:border-hairline-strong"
				style="animation-delay: 0ms"
			>
				<span class="relative flex h-1.5 w-1.5">
					<span
						class="absolute inset-0 animate-ping rounded-full bg-brand opacity-60"
					></span>
					<span class="relative h-1.5 w-1.5 rounded-full bg-brand"></span>
				</span>
				Public preview · v0.1
				<span class="text-muted-soft">→</span>
			</a>

			<h1
				class="reveal mt-6 font-display text-[40px] text-ink sm:text-5xl md:text-6xl lg:text-[64px]"
				style="line-height: 1.03; letter-spacing: -0.035em; animation-delay: 60ms"
			>
				The build tool<br />
				for your docs.
			</h1>

			<p
				class="reveal mt-6 max-w-xl text-lg leading-[1.55] text-body"
				style="animation-delay: 140ms"
			>
				docvia compiles Markdown into typed, pre-rendered modules for React,
				Svelte, Vite, and any framework with an adapter — with incremental
				builds and built-in search. Nothing parses at runtime.
			</p>

			<div
				class="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
				style="animation-delay: 220ms"
			>
				<Button size="lg" href="https://docs.docvia.dev">
					Get started
					<ArrowRight />
				</Button>
				<Button
					variant="outline"
					size="lg"
					href="https://github.com/kanakkholwal/docvia"
				>
					<Github />
					View on GitHub
				</Button>
			</div>

			<div class="reveal mt-7 max-w-md" style="animation-delay: 300ms">
				<InstallCommand pkg="@docvia/cli" />
			</div>

			<ul
				class="reveal mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted"
				style="animation-delay: 360ms"
			>
				{#each guarantees as item}
					<li class="inline-flex items-center gap-1.5">
						<Check class="h-4 w-4 text-check" />
						{item}
					</li>
				{/each}
			</ul>
		</div>

		<!-- ── Right: the compiler building itself, live (looping) ────── -->
		<div class="reveal lg:col-span-6 lg:pl-12" style="animation-delay: 200ms">
			<div
				class="rounded-2xl border border-hairline bg-surface-soft p-4 shadow-[0_30px_80px_-40px_rgba(10,10,10,0.55)] md:p-6"
			>
				<div
					class="overflow-hidden rounded-xl border border-hairline bg-canvas"
				>
					<div
						class="flex items-center gap-2 border-b border-hairline bg-surface-card/60 px-4 py-2.5"
					>
						<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-brand"></span>
						<span class="ml-3 font-mono text-[11px] text-muted">
							docvia · build
						</span>
					</div>
					<div class="min-h-58 space-y-2.5 p-5 font-mono text-[13px]">
						<div class="text-muted">$ docvia build</div>
						{#each buildLog.slice(0, shown) as line (line.label)}
							<div class="build-line flex items-center gap-3">
								<Check class="h-3.5 w-3.5 shrink-0 text-check" />
								<span class="w-14 font-semibold text-ink">{line.label}</span>
								<span class="flex-1 truncate text-body">{line.detail}</span>
								<span class="text-muted">{line.duration}</span>
							</div>
						{/each}
						{#if doneVisible}
							<div
								class="build-line border-t border-hairline pt-2.5 text-body-strong"
							>
								<span class="text-check">✓</span> Built 24 pages in
								<span class="font-semibold text-ink">412ms</span>
							</div>
						{:else}
							<div class="flex items-center gap-2 text-muted">
								<span class="cursor" aria-hidden="true"></span>
							</div>
						{/if}
					</div>
				</div>

				<div class="mt-4 px-1">
					<div
						class="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted"
					>
						Render targets
					</div>
					<div class="flex flex-wrap gap-2">
						{#each targets as t}
							<span
								class="rounded-full border border-hairline bg-canvas px-3 py-1 text-[13px] font-medium text-body-strong"
							>
								{t}
							</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Faint lime halo, top-left over the headline. */
	.glow {
		position: absolute;
		top: -12%;
		left: 8%;
		width: min(680px, 90%);
		height: 520px;
		background: radial-gradient(
			50% 50% at 50% 50%,
			color-mix(in oklab, var(--brand) 20%, transparent),
			transparent 70%
		);
		filter: blur(34px);
		opacity: 0.42;
		pointer-events: none;
	}
	.grid-floor {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--hairline) 1px, transparent 1px),
			linear-gradient(90deg, var(--hairline) 1px, transparent 1px);
		background-size: 44px 44px;
		-webkit-mask-image: radial-gradient(
			ellipse 80% 60% at 30% 30%,
			#000,
			transparent 72%
		);
		mask-image: radial-gradient(
			ellipse 80% 60% at 30% 30%,
			#000,
			transparent 72%
		);
		opacity: 0.35;
		pointer-events: none;
	}

	/* Each streamed build line fades + slides in. */
	.build-line {
		animation: line-in 0.28s var(--ease-out, ease-out) both;
	}
	@keyframes line-in {
		from {
			opacity: 0;
			transform: translateX(-6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* Blinking caret shown between build runs. */
	.cursor {
		display: inline-block;
		width: 8px;
		height: 15px;
		background: var(--brand);
		animation: blink 1.05s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	/* Entrance — CSS-driven so `prefers-reduced-motion` (handled globally in
	   app.css) neutralizes it, and content is present on first paint / no-JS. */
	.reveal {
		opacity: 0;
		animation: reveal-rise 0.5s var(--ease-out, ease-out) forwards;
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
		.reveal,
		.build-line {
			opacity: 1;
			animation: none;
			transform: none;
		}
		.cursor {
			animation: none;
		}
	}
</style>
