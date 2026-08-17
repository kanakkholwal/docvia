<script lang="ts">
import { ArrowRight, Check, Github } from "@lucide/svelte";
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import InstallCommand from "$lib/components/install-command.svelte";
import ShaderField from "$lib/components/shader-field.svelte";
import { version } from "$lib/version.svelte";

const buildLog = [
	{ label: "parse", detail: "docs/  ·  24 files", duration: "38ms" },
	{ label: "ir", detail: "transform → 312 nodes", duration: "21ms" },
	{ label: "react", detail: "emit .docvia/react", duration: "104ms" },
	{ label: "svelte", detail: "emit .docvia/svelte", duration: "98ms" },
	{ label: "static", detail: "emit .docvia/html", duration: "61ms" },
];

const targets = ["React", "Svelte", "Next.js", "Vite", "Static HTML"];

const guarantees = ["MIT licensed", "Self-host or BYO cloud", "No vendor lock-in"];

const TOTAL = buildLog.length;
const MAX_RUNS = 3; // then rest on the finished build; endless motion is a tax

// The terminal "builds" so the hero reads as the compiler working, not a static
// screenshot. SSR and reduced-motion render the full log statically (animate
// stays false, shown = TOTAL), so there is no blank first paint.
let animate = $state(false);
let step = $state(TOTAL);
let showDone = $state(true);

const shown = $derived(animate ? step : TOTAL);
const doneVisible = $derived(animate ? showDone : true);

let panel: HTMLElement | undefined = $state();

// Plain (non-reactive) controller: the loop drives $state, it is not driven by it.
let timer: ReturnType<typeof setTimeout> | undefined;
let runs = 0;
let onScreen = false;
let hovered = false;
let running = false;

const clear = () => {
	if (timer) clearTimeout(timer);
	timer = undefined;
};

const settle = () => {
	clear();
	running = false;
	step = TOTAL;
	showDone = true;
};

// Never animate off-screen or under the pointer, and stop after MAX_RUNS.
const blocked = () => !onScreen || hovered || runs >= MAX_RUNS;

const stream = () => {
	if (blocked()) return settle();
	if (step < TOTAL) {
		step += 1;
		timer = setTimeout(stream, 360);
		return;
	}
	timer = setTimeout(() => {
		showDone = true;
		runs += 1;
		running = false;
		if (runs < MAX_RUNS) timer = setTimeout(start, 2600);
	}, 280);
};

const start = () => {
	if (blocked()) return settle();
	running = true;
	step = 0;
	showDone = false;
	timer = setTimeout(stream, 480);
};

const kick = () => {
	if (running || blocked()) return;
	running = true;
	timer = setTimeout(start, 1000);
};

function pause() {
	hovered = true;
	settle();
}
function resume() {
	hovered = false;
	kick();
}

onMount(() => {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	if (!panel) return;

	animate = true;
	const io = new IntersectionObserver(
		([e]) => {
			onScreen = e.isIntersecting;
			if (onScreen) kick();
			else {
				clear();
				running = false;
			}
		},
		{ threshold: 0.3 },
	);
	io.observe(panel);

	return () => {
		clear();
		io.disconnect();
	};
});
</script>

<!-- Left-aligned 6/6 split with a vertical rule down the middle, measured off
     vite.dev, whose hero is not centered. -->
<section class="relative overflow-hidden border-b border-hairline bg-canvas">

	<div class="relative mx-auto grid max-w-page lg:grid-cols-2">
		<!-- ── Left: eyebrow, headline, CTA, install ──────────────────── -->
		<div
			class="flex flex-col px-5 py-14 sm:px-10 sm:py-20 lg:border-r lg:border-hairline"
		>
			<a
				href="https://github.com/kanakkholwal/docvia/releases"
				class="reveal group label-meta inline-flex w-fit items-center gap-2 transition-colors duration-(--motion-fast) ease-out hover:text-ink"
				style="animation-delay: 0ms"
			>
				<span class="relative flex h-1.5 w-1.5">
					<span
						class="absolute inset-0 animate-ping rounded-full bg-brand opacity-60"
					></span>
					<span class="relative h-1.5 w-1.5 rounded-full bg-brand"></span>
				</span>
				Public preview · v{version.current}
				<ArrowRight
					class="h-3 w-3 transition-transform duration-(--motion-fast) ease-out group-hover:translate-x-0.5"
				/>
			</a>

			<h1
				class="reveal mt-6 max-w-104 font-display text-[40px] leading-[1.12] tracking-tighter text-ink sm:text-5xl md:text-[60px]"
				style="animation-delay: 40ms"
			>
				The build tool for your docs.
			</h1>

			<p
				class="reveal mt-6 max-w-md text-[18px] leading-7 text-body"
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
				class="reveal mt-auto w-full max-w-md pt-16"
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

		<!-- ── Right: the compiler building itself, live (looping) ─────── -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={panel}
			onmouseenter={pause}
			onmouseleave={resume}
			onfocusin={pause}
			onfocusout={resume}
			class="reveal relative flex items-center px-5 py-14 sm:px-10 sm:py-20"
			style="animation-delay: 200ms"
		>
			<ShaderField />

			<!-- Terminal floats on the field, so the surface goes translucent. -->
			<div
				class="relative w-full overflow-hidden rounded-md border border-hairline bg-surface-soft/70 backdrop-blur-xl"
			>
				<div
					class="flex items-center gap-2 border-b border-hairline bg-surface-card/60 px-4 py-2.5"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-brand"></span>
					<span class="ml-3 font-mono text-[11px] text-muted">docvia · build</span>
				</div>

				<div class="min-h-58 space-y-2.5 p-5 font-mono text-[13px] sm:p-6">
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
						<div class="build-line border-t border-hairline pt-2.5 text-body-strong">
							<span class="text-brand-ink">✓</span> Built 24 pages in
							<span class="font-semibold text-ink">412ms</span>
						</div>
					{:else}
						<div class="flex items-center gap-2 text-muted">
							<span class="cursor" aria-hidden="true"></span>
						</div>
					{/if}
				</div>

				<div
					class="flex flex-wrap items-center gap-2 border-t border-hairline bg-surface-card/60 px-4 py-3"
				>
					<span class="label-meta mr-1">Render targets</span>
					{#each targets as t}
						<span
							class="rounded-full bg-surface-strong px-2.5 py-1 text-[12px] font-medium text-body"
						>
							{t}
						</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.build-line {
		animation: line-in 0.28s var(--ease-out) both;
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
